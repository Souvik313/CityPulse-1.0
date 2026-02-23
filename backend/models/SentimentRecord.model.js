import mongoose from 'mongoose';

const SentimentRecordSchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
    index: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ["chatbot"],
    default: "chatbot"
  },
  topic: {
    type: String,
    enum: ["traffic", "pollution", "weather", "safety", "other"],
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  emotion: String,
  confidence: Number,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

SentimentRecordSchema.index({city: 1, createdAt: -1});

const SentimentRecord = new mongoose.model("SentimentRecord", SentimentRecordSchema);
export default SentimentRecord;
