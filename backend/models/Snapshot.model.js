import mongoose from "mongoose";

const CityPulseSnapshotSchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  aqi: {
    value: Number,
    category: String
  },
  weather: {
    temperature: Number,
    condition: String
  },
  traffic: {
    congestionLevel: Number, 
    avgSpeed: Number     
  },
  sentiment: {
    score: Number,
    dominantEmotion: String,
    sampleSize: Number
  }
} , {timestamps: true});

CityPulseSnapshotSchema.index({city: 1, timestamp: -1});

const CityPulseSnapshot = new mongoose.model("CityPulseSnapshot", CityPulseSnapshotSchema , "citypulsesnapshots");
export default CityPulseSnapshot;
