import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import path from 'path';
import fs from 'fs';
import AQIData from '../../models/AQI.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
console.log('Loading .env from:', path.join(__dirname, '..', '..', '.env.development.local'));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.development.local') });
console.log('DB_URI loaded:', process.env.DB_URI ? 'YES' : 'NO');

const { DB_URI } = process.env;

if (!DB_URI) {
    console.error('DB_URI is not defined in environment variables');
    process.exit(1);
}

const MAX_HOUR_GAP = 3; // Maximum hours between consecutive records to form a training sample

/**
 * Build AQI dataset for next-hour prediction
 * @param {string} cityId - MongoDB ObjectId of the city
 * @param {number} daysBack - Number of days to look back (default: 14)
 * @param {string} outputFormat - 'json' or 'csv' (default: 'json')
 * @returns {Promise<Array>} Array of training samples
 */
async function buildAqiDataset(cityId, daysBack = 30, outputFormat = 'json') {
    try {
        // Connect to database
        await mongoose.connect(DB_URI);
        console.log('Connected to database');

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - daysBack);

        console.log(`Fetching AQI data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Fetch all AQI records for the city in the date range, sorted by time
        const aqiRecords = await AQIData.find({
            city: cityId,
            recordedAt: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .sort({ recordedAt: 1 })
        .lean();

        console.log(`Found ${aqiRecords.length} AQI records`);

        if (aqiRecords.length < 50) {
            throw new Error(`Insufficient data: Need at least 50 records, got ${aqiRecords.length}`);
        }

        // Build dataset with features and targets
        const dataset = [];

        // Process each record as a potential training sample
        // Skip the last record since we need next-hour target
        for (let i = 0; i < aqiRecords.length - 1; i++) {
            const currentRecord = aqiRecords[i];
            const nextRecord = aqiRecords[i + 1];

            // Only create sample if next record is approximately 1 hour ahead
            const timeDiff = (nextRecord.recordedAt - currentRecord.recordedAt) / (1000 * 60 * 60); // hours

            // Accept records within 0.5 to MAX_HOUR_GAP hours (handles data gaps)
            if (timeDiff < 0.5 || timeDiff > MAX_HOUR_GAP) {
                continue;
            }

            const currentTime = currentRecord.recordedAt;
            const features = extractFeatures(currentRecord, aqiRecords, i, currentTime);

            // Target: next hour's AQI value
            const target = nextRecord.aqiValue;

            dataset.push({
                ...features,
                target_aqi: target,
                timestamp: currentTime.toISOString()
            });
        }

        // Guard: check dataset is not empty before accessing dataset[0]
        if (dataset.length === 0) {
            console.warn('No valid training samples could be created. Check time gaps between records.');
            return dataset;
        }

        console.log(`Created ${dataset.length} training samples`);

        // Save dataset to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const cityStr = cityId.toString().slice(-6); // Last 6 chars of city ID for filename
        const filename = `aqi_dataset_${cityStr}_${timestamp}.${outputFormat}`;
        const outputPath = resolve(__dirname, filename);

        if (outputFormat === 'csv') {
            await saveAsCSV(dataset, outputPath);
        } else {
            await saveAsJSON(dataset, outputPath);
        }

        console.log(`Dataset saved to: ${outputPath}`);
        console.log(`\nDataset Statistics:`);
        console.log(`- Total samples: ${dataset.length}`);
        console.log(`- Features per sample: ${Object.keys(dataset[0]).length - 2}`); // Exclude target and timestamp
        console.log(`- Target range: ${Math.min(...dataset.map(d => d.target_aqi))} - ${Math.max(...dataset.map(d => d.target_aqi))}`);

        return dataset;

    } catch (error) {
        console.error('Error building dataset:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

/**
 * Extract features from current record and historical data
 */
function extractFeatures(currentRecord, allRecords, currentIndex, currentTime) {
    const features = {};

    // === Current values ===
    features.current_aqi = currentRecord.aqiValue || 0;
    features.current_pm25 = currentRecord.pollutants?.pm25 || 0;
    features.current_pm10 = currentRecord.pollutants?.pm10 || 0;
    features.current_no2 = currentRecord.pollutants?.no2 || 0;
    features.current_so2 = currentRecord.pollutants?.so2 || 0;
    features.current_o3 = currentRecord.pollutants?.o3 || 0;
    features.current_co2 = currentRecord.pollutants?.co2 || 0;

    // === Time-based features ===
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = currentTime.getDate();

    features.hour_of_day = hour;
    features.day_of_week = dayOfWeek;
    features.day_of_month = dayOfMonth;
    features.is_weekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

    // === Recent trends (last 1 hour, 6 hours, 24 hours) ===
    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    const recent1h = getRecordsInRange(allRecords, currentIndex, oneHourAgo, currentTime);
    const recent6h = getRecordsInRange(allRecords, currentIndex, sixHoursAgo, currentTime);
    const recent24h = getRecordsInRange(allRecords, currentIndex, twentyFourHoursAgo, currentTime);

    // AQI trends
    features.avg_aqi_1h = calculateMean(recent1h.map(r => r.aqiValue));
    features.avg_aqi_6h = calculateMean(recent6h.map(r => r.aqiValue));
    features.avg_aqi_24h = calculateMean(recent24h.map(r => r.aqiValue));

    features.max_aqi_1h = calculateMax(recent1h.map(r => r.aqiValue));
    features.max_aqi_6h = calculateMax(recent6h.map(r => r.aqiValue));
    features.max_aqi_24h = calculateMax(recent24h.map(r => r.aqiValue));

    features.min_aqi_1h = calculateMin(recent1h.map(r => r.aqiValue));
    features.min_aqi_6h = calculateMin(recent6h.map(r => r.aqiValue));
    features.min_aqi_24h = calculateMin(recent24h.map(r => r.aqiValue));

    features.std_aqi_1h = calculateStd(recent1h.map(r => r.aqiValue));
    features.std_aqi_6h = calculateStd(recent6h.map(r => r.aqiValue));
    features.std_aqi_24h = calculateStd(recent24h.map(r => r.aqiValue));

    // Trend indicators (difference from current)
    features.delta_aqi_1h = features.avg_aqi_1h - features.current_aqi;
    features.delta_aqi_6h = features.avg_aqi_6h - features.current_aqi;
    features.delta_aqi_24h = features.avg_aqi_24h - features.current_aqi;

    // === Pollutant trends (6h and 24h averages) ===
    const pollutants = ['pm25', 'pm10', 'no2', 'so2', 'o3', 'co2'];
    pollutants.forEach(pollutant => {
        const values6h = recent6h.map(r => r.pollutants?.[pollutant]).filter(v => v != null);
        const values24h = recent24h.map(r => r.pollutants?.[pollutant]).filter(v => v != null);

        features[`avg_${pollutant}_6h`] = calculateMean(values6h);
        features[`avg_${pollutant}_24h`] = calculateMean(values24h);
    });

    // === Historical patterns (same hour yesterday, same hour last week) ===
    const yesterday = new Date(currentTime);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(hour, 0, 0, 0);

    const lastWeek = new Date(currentTime);
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(hour, 0, 0, 0);

    const yesterdayRecord = findClosestRecord(allRecords, currentIndex, yesterday, 2);
    const lastWeekRecord = findClosestRecord(allRecords, currentIndex, lastWeek, 2);

    features.aqi_same_hour_yesterday = yesterdayRecord?.aqiValue || features.current_aqi;
    features.aqi_same_hour_last_week = lastWeekRecord?.aqiValue || features.current_aqi;

    // === Moving averages (7-day and 14-day windows) ===
    const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(currentTime.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent7d = getRecordsInRange(allRecords, currentIndex, sevenDaysAgo, currentTime);
    const recent14d = getRecordsInRange(allRecords, currentIndex, fourteenDaysAgo, currentTime);

    features.avg_aqi_7d = calculateMean(recent7d.map(r => r.aqiValue));
    features.avg_aqi_14d = calculateMean(recent14d.map(r => r.aqiValue));

    // === Rate of change (slope) ===
    if (recent6h.length >= 2) {
        const times6h = recent6h.map(r => r.recordedAt.getTime());
        const aqis6h = recent6h.map(r => r.aqiValue);
        features.aqi_slope_6h = calculateSlope(times6h, aqis6h);
    } else {
        features.aqi_slope_6h = 0;
    }

    if (recent24h.length >= 2) {
        const times24h = recent24h.map(r => r.recordedAt.getTime());
        const aqis24h = recent24h.map(r => r.aqiValue);
        features.aqi_slope_24h = calculateSlope(times24h, aqis24h);
    } else {
        features.aqi_slope_24h = 0;
    }

    // Replace NaN/Infinity values with 0
    Object.keys(features).forEach(key => {
        if (!isFinite(features[key])) {
            features[key] = 0;
        }
    });

    return features;
}

/**
 * Get records within a time range (backwards from current index)
 */
function getRecordsInRange(allRecords, currentIndex, startTime, endTime) {
    const records = [];
    // Search backwards from current index — data is pre-sorted ascending by recordedAt
    for (let i = currentIndex; i >= 0; i--) {
        const record = allRecords[i];
        if (record.recordedAt < startTime) break;
        if (record.recordedAt >= startTime && record.recordedAt <= endTime) {
            records.unshift(record); // Maintain chronological order
        }
    }
    return records;
}

/**
 * Find closest record to target time within maxHoursDiff
 * Uses a wider search window (±24 records) to handle non-hourly spaced data
 */
function findClosestRecord(allRecords, currentIndex, targetTime, maxHoursDiff = 2) {
    let closestRecord = null;
    let minDiff = Infinity;
    const maxDiff = maxHoursDiff * 60 * 60 * 1000;

    // Estimate index based on target time, with wider ±24 window for irregular data
    const estimatedIndex = currentIndex - Math.floor(
        (allRecords[currentIndex].recordedAt - targetTime) / (60 * 60 * 1000)
    );
    const searchStart = Math.max(0, estimatedIndex - 24);
    const searchEnd = Math.min(allRecords.length - 1, estimatedIndex + 24);

    for (let i = searchStart; i <= searchEnd && i <= currentIndex; i++) {
        const diff = Math.abs(allRecords[i].recordedAt - targetTime);
        if (diff < minDiff && diff <= maxDiff) {
            minDiff = diff;
            closestRecord = allRecords[i];
        }
    }

    return closestRecord;
}

/**
 * Calculate mean (handles empty arrays)
 */
function calculateMean(values) {
    if (!values || values.length === 0) return 0;
    const filtered = values.filter(v => v != null && isFinite(v));
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
}

/**
 * Calculate standard deviation
 */
function calculateStd(values) {
    if (!values || values.length === 0) return 0;
    const filtered = values.filter(v => v != null && isFinite(v));
    if (filtered.length === 0) return 0;
    const mean = calculateMean(filtered);
    const variance = filtered.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / filtered.length;
    return Math.sqrt(variance);
}

/**
 * Calculate max
 */
function calculateMax(values) {
    if (!values || values.length === 0) return 0;
    const filtered = values.filter(v => v != null && isFinite(v));
    if (filtered.length === 0) return 0;
    return Math.max(...filtered);
}

/**
 * Calculate min
 */
function calculateMin(values) {
    if (!values || values.length === 0) return 0;
    const filtered = values.filter(v => v != null && isFinite(v));
    if (filtered.length === 0) return 0;
    return Math.min(...filtered);
}

/**
 * Calculate slope (linear regression)
 * Pairs x and y together before filtering to avoid index mismatch
 */
function calculateSlope(times, values) {
    if (!times || !values || times.length < 2 || values.length < 2) return 0;

    // Pair times and values together, then filter out invalid values
    const paired = times
        .slice(0, Math.min(times.length, values.length))
        .map((t, i) => ({ t, v: values[i] }))
        .filter(p => p.v != null && isFinite(p.v));

    if (paired.length < 2) return 0;

    // Normalize times to start from 0, convert to hours
    const tMin = Math.min(...paired.map(p => p.t));
    const xNorm = paired.map(p => (p.t - tMin) / (1000 * 60 * 60));
    const y = paired.map(p => p.v);

    const xMean = calculateMean(xNorm);
    const yMean = calculateMean(y);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < xNorm.length; i++) {
        numerator += (xNorm[i] - xMean) * (y[i] - yMean);
        denominator += Math.pow(xNorm[i] - xMean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Save dataset as JSON
 */
async function saveAsJSON(dataset, filepath) {
    const jsonContent = JSON.stringify(dataset, null, 2);
    fs.writeFileSync(filepath, jsonContent, 'utf8');
}

/**
 * Save dataset as CSV
 * Properly escapes quotes inside string values
 */
async function saveAsCSV(dataset, filepath) {
    if (dataset.length === 0) {
        throw new Error('Dataset is empty');
    }

    const headers = Object.keys(dataset[0]);
    const csvRows = [headers.join(',')];

    dataset.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Properly escape all strings — double up any internal quotes
            if (typeof value === 'string') {
                const escaped = value.replace(/"/g, '""');
                return `"${escaped}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });

    fs.writeFileSync(filepath, csvRows.join('\n'), 'utf8');
}

// Main execution
// Usage: node buildAqiDataset.js <cityId> [daysBack] [format]
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node buildAqiDataset.js <cityId> [daysBack] [format]');
    console.log('  cityId: MongoDB ObjectId of the city (required)');
    console.log('  daysBack: Number of days to look back (default: 14)');
    console.log('  format: Output format - "json" or "csv" (default: "json")');
    console.log('\nExample: node buildAqiDataset.js 507f1f77bcf86cd799439011 14 json');
    process.exit(1);
}

const cityId = args[0];
const daysBack = args[1] ? parseInt(args[1]) : 14;
const format = args[2] || 'json';

if (!mongoose.Types.ObjectId.isValid(cityId)) {
    console.error('Invalid city ID format. Must be a valid MongoDB ObjectId.');
    process.exit(1);
}

buildAqiDataset(cityId, daysBack, format)
    .then(() => {
        console.log('\nDataset building completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to build dataset:', error);
        process.exit(1);
    });