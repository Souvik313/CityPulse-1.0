import AQIData from "../models/AQI.model.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Get AQI trends for a city over a time period
 * @param {import('mongoose').Types.ObjectId} cityId - City ObjectId
 * @param {{ period?: '24h' | '7d' }} options - period: 24h or 7d (default 24h)
 * @returns {Promise<Object>} Trend summary
 */
export async function getAQITrends(cityId, options = {}) {
  const period = options.period || "24h";
  const windowMs = period === "7d" ? 7 * DAY_MS : 24 * HOUR_MS;
  const startDate = new Date(Date.now() - windowMs);

  const records = await AQIData.find({
    city: cityId,
    recordedAt: { $gte: startDate },
  })
    .sort({ recordedAt: 1 })
    .lean();

  if (!records.length) {
    return {
      period,
      current: null,
      summary: "No AQI data in this period.",
      trend: null,
      average: null,
      min: null,
      max: null,
      direction: null,
      dominantPollutant: null,
      peakHour: null,
      dataPoints: 0,
    };
  }

  const values = records.map((r) => r.aqiValue).filter((v) => v != null);
  const latest = records[records.length - 1];
  const current = {
    aqi: latest.aqiValue,
    category: latest.category,
    recordedAt: latest.recordedAt,
  };

  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const diff = current.aqi - avg;
  let direction = "stable";
  if (diff <= -5) direction = "improving";
  else if (diff >= 5) direction = "worsening";

  const pollNames = ["pm25", "pm10", "no2", "so2", "o3", "co2"];
  const pollSums = {};
  const pollCounts = {};
  pollNames.forEach((p) => {
    pollSums[p] = 0;
    pollCounts[p] = 0;
  });

  records.forEach((r) => {
    const poll = r.pollutants || {};
    pollNames.forEach((name) => {
      const v = poll[name];
      if (v != null && typeof v === "number") {
        pollSums[name] += v;
        pollCounts[name]++;
      }
    });
  });

  let dominantPollutant = null;
  let maxPollAvg = 0;
  pollNames.forEach((name) => {
    if (pollCounts[name] > 0) {
      const avgPoll = pollSums[name] / pollCounts[name];
      if (avgPoll > maxPollAvg) {
        maxPollAvg = avgPoll;
        dominantPollutant = name.toUpperCase().replace("25", "2.5");
      }
    }
  });

  const byHour = {};
  for (let h = 0; h < 24; h++) byHour[h] = { sum: 0, count: 0 };
  records.forEach((r) => {
    const h = new Date(r.recordedAt).getUTCHours();
    byHour[h].sum += r.aqiValue;
    byHour[h].count++;
  });

  let peakHour = null;
  let peakAvg = 0;
  Object.entries(byHour).forEach(([hour, { sum, count }]) => {
    if (count > 0) {
      const avgH = sum / count;
      if (avgH > peakAvg) {
        peakAvg = avgH;
        peakHour = Number(hour);
      }
    }
  });

  const summary =
    direction === "improving"
      ? "AQI has improved compared to the period average."
      : direction === "worsening"
        ? "AQI has worsened compared to the period average."
        : "AQI is stable compared to the period average.";

  return {
    period,
    current,
    summary,
    trend: {
      direction,
      changeFromAverage: Math.round(diff * 10) / 10,
    },
    average: Math.round(avg * 10) / 10,
    min: minVal,
    max: maxVal,
    direction,
    dominantPollutant,
    peakHour:
      peakHour != null
        ? { hour: peakHour, averageAQI: Math.round(peakAvg * 10) / 10 }
        : null,
    dataPoints: records.length,
  };
}
