import mongoose from "mongoose";

const weatherDataSchema = new mongoose.Schema({
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true,
        index: true
    },
    source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DataSource",
        required: true,
    },
    temperature: {
        type: Number,
        required: true
    },
    feelsLiks: Number,
    humidity: Number,
    pressure: Number,
    wind: {
        speed: Number,
        direction: String,
    },
    precipitation: {
        rain: Number,
        snow: Number
    },
    visibility: Number,
    cloudCover: Number,
    condition: {
      main: String,
      description: String
    },
    uvIndex: Number,
    dewPoint: Number,
    recordedAt: {
      type: Date,
      required: true,
      index: true
    },
    ingestionMeta: {
      fetchedAt: Date,
      apiLatencyMs: Number,
      confidence: Number
    }
}, {timestamps: true});

weatherDataSchema.index({city: 1, recordedAt: -1});

const WeatherData = new mongoose.model("WeatherData", weatherDataSchema , "weatherdata");
export default WeatherData;