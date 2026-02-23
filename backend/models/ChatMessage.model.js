import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatSession",
        required: true,
        index: true
    },
    sender: {
        type: String,
        enum: ["user", "bot"],
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        enum: ["en", "hi", "bn"],
        default: "en"
    },
    tokens: Number,
    topicHint: {
      type: String,
      enum: ["traffic", "pollution", "weather", "safety", "other"]
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
} , {timestamps: true});

chatMessageSchema.index({session: 1, createdAt: -1});

const ChatMessage = new mongoose.model("ChatMessage", chatMessageSchema, "chatmessages");
export default ChatMessage;