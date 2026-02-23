import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    learningRate: 0.001,
    earlyStopping: {
        patience: 10,
        monitor: 'val_loss'
    }
};

/**
 * Load dataset from JSON file
 * @param {string} datasetPath - Path to JSON dataset file
 * @returns {Promise<Array>} Dataset array
 */
async function loadDataset(datasetPath) {
    if (!datasetPath) {
        throw new Error('Dataset path is required. Please provide path to JSON dataset file.');
    }

    if (!fs.existsSync(datasetPath)) {
        throw new Error(`Dataset file not found: ${datasetPath}`);
    }

    console.log(`Loading dataset from: ${datasetPath}`);
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`Loaded ${data.length} samples from file`);
    
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Dataset file is empty or invalid format');
    }

    return data;
}

/**
 * Extract features and targets from dataset
 * @param {Array} dataset - Dataset array
 * @returns {Object} {features, targets}
 */
function extractFeaturesAndTargets(dataset) {
    // Get feature names (exclude target_aqi and timestamp)
    const sample = dataset[0];
    const featureNames = Object.keys(sample).filter(
        key => key !== 'target_aqi' && key !== 'timestamp'
    );

    console.log(`\nFeatures (${featureNames.length}):`, featureNames.join(', '));

    // Extract features and targets
    const features = [];
    const targets = [];

    dataset.forEach(row => {
        const featureRow = featureNames.map(name => {
            const value = row[name];
            return isFinite(value) ? value : 0;
        });
        features.push(featureRow);
        targets.push(row.target_aqi);
    });

    return {
        features: tf.tensor2d(features),
        targets: tf.tensor2d(targets, [targets.length, 1]),
        featureNames
    };
}

/**
 * Normalize features using min-max scaling
 * @param {tf.Tensor} features - Feature tensor
 * @returns {Object} {normalized, min, max}
 */
function normalizeFeatures(features) {
    const min = features.min(0);
    const max = features.max(0);
    const range = max.sub(min);
    
    // Avoid division by zero
    const rangeSafe = range.add(1e-8);
    const normalized = features.sub(min).div(rangeSafe);

    return { normalized, min, max };
}

/**
 * Denormalize predictions
 */
function denormalizeTarget(targets, min, max) {
    const range = max.sub(min).add(1e-8);
    return targets.mul(range).add(min);
}

/**
 * Create neural network model
 * @param {number} inputSize - Number of input features
 * @returns {tf.LayersModel} Compiled model
 */
function createModel(inputSize) {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
        inputShape: [inputSize],
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Hidden layers
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
        units: 32,
        activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output layer (single value for AQI prediction)
    model.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
    }));

    // Compile model
    model.compile({
        optimizer: tf.train.adam(CONFIG.learningRate),
        loss: 'meanSquaredError',
        metrics: ['meanAbsoluteError']
    });

    return model;
}

/**
 * Calculate metrics
 */
function calculateMetrics(predictions, targets) {
    const mse = tf.losses.meanSquaredError(targets, predictions);
    const mae = tf.losses.absoluteDifference(targets, predictions);
    
    // Calculate R²
    const targetsMean = targets.mean();
    const ssRes = tf.sum(tf.square(targets.sub(predictions)));
    const ssTot = tf.sum(tf.square(targets.sub(targetsMean)));
    const r2 = tf.tensor1d([1]).sub(ssRes.div(ssTot.add(1e-8)));

    // Calculate RMSE
    const rmse = tf.sqrt(mse);

    return { mse, mae, rmse, r2 };
}

/**
 * Train the model
 */
async function trainModel(datasetPath, modelSavePath = null) {
    try {
        console.log('🚀 Starting AQI Model Training\n');

        // Load dataset
        const dataset = await loadDataset(datasetPath);

        if (dataset.length < 100) {
            throw new Error(`Insufficient data: Need at least 100 samples, got ${dataset.length}`);
        }

        console.log(`\n📊 Dataset Statistics:`);
        console.log(`- Total samples: ${dataset.length}`);
        console.log(`- Target AQI range: ${Math.min(...dataset.map(d => d.target_aqi))} - ${Math.max(...dataset.map(d => d.target_aqi))}`);
        console.log(`- Average AQI: ${(dataset.reduce((sum, d) => sum + d.target_aqi, 0) / dataset.length).toFixed(2)}`);

        // Extract features and targets
        const { features, targets, featureNames } = extractFeaturesAndTargets(dataset);

        // Normalize features
        console.log('\n🔄 Normalizing features...');
        const { normalized: normalizedFeatures, min: featureMin, max: featureMax } = normalizeFeatures(features);

        // Normalize targets
        const targetMin = targets.min();
        const targetMax = targets.max();
        const targetRange = targetMax.sub(targetMin).add(1e-8);
        const normalizedTargets = targets.sub(targetMin).div(targetRange);

        // Split dataset
        const splitIndex = Math.floor(dataset.length * (1 - CONFIG.validationSplit));
        const trainFeatures = normalizedFeatures.slice([0, 0], [splitIndex, -1]);
        const trainTargets = normalizedTargets.slice([0, 0], [splitIndex, -1]);
        const valFeatures = normalizedFeatures.slice([splitIndex, 0], [-1, -1]);
        const valTargets = normalizedTargets.slice([splitIndex, 0], [-1, -1]);

        console.log(`\n📦 Train/Validation Split:`);
        console.log(`- Training samples: ${splitIndex}`);
        console.log(`- Validation samples: ${dataset.length - splitIndex}`);

        // Create model
        console.log('\n🏗️  Creating model...');
        const model = createModel(featureNames.length);
        model.summary();

        // Training callbacks
        const callbacks = {
            onEpochEnd: (epoch, logs) => {
                if ((epoch + 1) % 10 === 0) {
                    console.log(
                        `Epoch ${epoch + 1}/${CONFIG.epochs} - ` +
                        `loss: ${logs.loss.toFixed(4)}, ` +
                        `val_loss: ${logs.val_loss.toFixed(4)}, ` +
                        `mae: ${logs.meanAbsoluteError.toFixed(4)}, ` +
                        `val_mae: ${logs.val_meanAbsoluteError.toFixed(4)}`
                    );
                }
            }
        };

        // Train model
        console.log('\n🎓 Training model...');
        const history = await model.fit(trainFeatures, trainTargets, {
            epochs: CONFIG.epochs,
            batchSize: CONFIG.batchSize,
            validationData: [valFeatures, valTargets],
            callbacks,
            verbose: 0
        });

        // Make predictions for evaluation
        console.log('\n📈 Evaluating model...');
        const trainPredictionsNorm = model.predict(trainFeatures);
        const valPredictionsNorm = model.predict(valFeatures);

        // Denormalize predictions
        const trainPredictions = trainPredictionsNorm.mul(targetRange).add(targetMin);
        const valPredictions = valPredictionsNorm.mul(targetRange).add(targetMin);

        // Denormalize targets for metrics
        const trainTargetsActual = trainTargets.mul(targetRange).add(targetMin);
        const valTargetsActual = valTargets.mul(targetRange).add(targetMin);

        // Calculate metrics
        const trainMetrics = calculateMetrics(trainPredictions, trainTargetsActual);
        const valMetrics = calculateMetrics(valPredictions, valTargetsActual);

        console.log('\n📊 Training Metrics:');
        console.log(`- MSE: ${(await trainMetrics.mse.data())[0].toFixed(4)}`);
        console.log(`- RMSE: ${(await trainMetrics.rmse.data())[0].toFixed(4)}`);
        console.log(`- MAE: ${(await trainMetrics.mae.data())[0].toFixed(4)}`);
        console.log(`- R²: ${(await trainMetrics.r2.data())[0].toFixed(4)}`);

        console.log('\n📊 Validation Metrics:');
        console.log(`- MSE: ${(await valMetrics.mse.data())[0].toFixed(4)}`);
        console.log(`- RMSE: ${(await valMetrics.rmse.data())[0].toFixed(4)}`);
        console.log(`- MAE: ${(await valMetrics.mae.data())[0].toFixed(4)}`);
        console.log(`- R²: ${(await valMetrics.r2.data())[0].toFixed(4)}`);

        // Save model
        if (!modelSavePath) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            modelSavePath = resolve(__dirname, `aqi_model_${timestamp}`);
        }

        console.log(`\n💾 Saving model to: ${modelSavePath}`);
        await model.save(`file://${modelSavePath}`);

        // Save normalization parameters
        const normalizationParams = {
            featureMin: (await featureMin.data()),
            featureMax: (await featureMax.data()),
            targetMin: (await targetMin.data())[0],
            targetMax: (await targetMax.data())[0],
            featureNames
        };

        const paramsPath = resolve(modelSavePath, 'normalization_params.json');
        fs.writeFileSync(paramsPath, JSON.stringify(normalizationParams, null, 2));
        console.log(`💾 Saved normalization parameters to: ${paramsPath}`);

        // Cleanup tensors
        features.dispose();
        targets.dispose();
        normalizedFeatures.dispose();
        normalizedTargets.dispose();
        trainFeatures.dispose();
        trainTargets.dispose();
        valFeatures.dispose();
        valTargets.dispose();
        trainPredictionsNorm.dispose();
        valPredictionsNorm.dispose();
        trainPredictions.dispose();
        valPredictions.dispose();
        trainTargetsActual.dispose();
        valTargetsActual.dispose();
        featureMin.dispose();
        featureMax.dispose();
        targetMin.dispose();
        targetMax.dispose();

        console.log('\n✅ Model training completed successfully!');

        return {
            model,
            modelPath: modelSavePath,
            trainMetrics,
            valMetrics,
            normalizationParams
        };

    } catch (error) {
        console.error('❌ Training failed:', error);
        throw error;
    }
}

// Main execution
// Usage: node aqi_train.model.js <datasetPath> [modelSavePath]
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node aqi_train.model.js <datasetPath> [modelSavePath]');
    console.log('  datasetPath: Path to JSON dataset file (required)');
    console.log('  modelSavePath: Path to save the trained model (optional)');
    console.log('\nExamples:');
    console.log('  node aqi_train.model.js ../datasets/aqi_dataset_abc123_2024-01-01.json');
    console.log('  node aqi_train.model.js ../datasets/aqi_dataset.json ./models/my_model');
    console.log('\nNote: First generate dataset using: node ../datasets/buildAqiDataset.js <cityId>');
    process.exit(1);
}

const datasetPath = args[0];
const modelSavePath = args[1] || null;

trainModel(datasetPath, modelSavePath)
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
