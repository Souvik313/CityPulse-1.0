import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true,
        index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: Date,
    messageCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "ended", "expired"],
      default: "active"
    },
    dominantTopic: {
      type: String,
      enum: ["traffic", "pollution", "weather", "safety", "other"]
    },
    sentimentSummary: {
      score: Number,
      emotion: String
    },
    language: {
      type: String,
      default: "en"
    },
    expiresAt: {
      type: Date
    }
}, {timestamps: false});

chatSessionSchema.index({city: 1, startedAt: -1});

const ChatSession = new mongoose.model("ChatSession", chatSessionSchema , "chatsessions");
export default ChatSession;