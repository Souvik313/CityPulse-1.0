import mongoose from 'mongoose';

export const initTimeSeriesCollections = async() => {
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Weather data collection
    if (!collectionNames.includes("weatherdata")) {
        await db.createCollection("weatherdata", {
        timeseries: {
            timeField: "recordedAt",
            metaField: "city",
            granularity: "minutes"
        }
        });
        console.log("✅ weatherdata created");
    }

    // AQI data collection
    if (!collectionNames.includes("aqidata")) {
        await db.createCollection("aqidata", {
        timeseries: {
            timeField: "recordedAt",
            metaField: "city",
            granularity: "minutes"
        }
        });
        console.log("✅ aqidata created");
    }

    // Traffic data collection
    if(!collectionNames.includes("trafficdata")) {
        await db.createCollection("trafficdata", {
        timeseries: {
            timeField: "recordedAt",
            metaField: "city",
            granularity: "minutes"
        }
        });
        console.log("✅ trafficdata created");
    }
}