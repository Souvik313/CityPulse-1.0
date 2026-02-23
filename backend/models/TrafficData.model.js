import mongoose from "mongoose";

const trafficSchema = new mongoose.Schema(
  {
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DataSource",
      required: true
    },
    congestion: {
      level: {
        type: String,
        enum: ["low", "medium", "moderate" , "high", "unknown"],
        default: "unknown"
      },
      travelTimeIndex: {
        type: Number,
        default: null
      }
    },
    speed: {
      average: {
        type: Number,
        default: null
      },
      freeFlow: {
        type: Number,
        default: null
      }
    },
    roadClosureCount: {
      type: Number,
      default: 0
    },
    incidents: {
      count: {
        type: Number,
        default: 0
      },
      types: {
        type: [String],
        default: []
      }
    },
    hotspots: [
      {
        lat: { type: Number },
        lng: { type: Number },
        severity: { type: Number, default: 0 },
        roadName: { type: String },
        delaySeconds: { type: Number }
      }
    ],
    ingestionMeta: {
      fetchedAt: { type: Date, default: Date.now },
      apiLatencyMs: { type: Number, default: 0 },
      confidence: { type: Number, default: 1 }
    },

    recordedAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: false}
);

trafficSchema.index({city:1, recordedAt: -1});

const TrafficData = new mongoose.model("TrafficData", trafficSchema , "trafficdata");
export default TrafficData;