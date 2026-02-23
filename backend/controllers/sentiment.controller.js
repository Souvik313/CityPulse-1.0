import ChatMessage from "../models/ChatMessage.model.js";
import ChatSession from "../models/ChatSession.model.js";
import SentimentRecord from "../models/SentimentRecord.model.js";
import City from "../models/city.model.js";
import { analyzeSentiment } from "../services/sentiment.service.js";
import { getSentimentTrends } from "../services/sentimentTrends.service.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

/** Analyze text and return sentiment (no DB write). */
export const analyzeText = catchAsync(async (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return next(new AppError("Text is required for sentiment analysis", 400));
  }
  const result = await analyzeSentiment(text);
  res.status(200).json({
    status: "success",
    data: result || { topic: "other", score: 0, emotion: "neutral", confidence: 0 },
  });
});

/** Analyze a chat message by ID and store result (for optional explicit re-analysis). */
export const analyzeChatSentiment = catchAsync(async (req, res, next) => {
  const { messageId } = req.body;
  if (!messageId) {
    return next(new AppError("Message ID is required for sentiment analysis", 400));
  }
  const message = await ChatMessage.findById(messageId).populate("session");
  if (!message) {
    return next(new AppError("Chat message not found", 404));
  }
  const sentimentResult = await analyzeSentiment(message.content);
  if (!sentimentResult) {
    return res.status(200).json({
      status: "success",
      data: { messageId: message._id, sentiment: null },
    });
  }
  const sentimentRecord = await SentimentRecord.create({
    city: message.session.city,
    session: message.session._id,
    source: "chatbot",
    topic: sentimentResult.topic,
    score: sentimentResult.score,
    emotion: sentimentResult.emotion,
    confidence: sentimentResult.confidence,
  });
  res.status(201).json({
    status: "success",
    data: {
      messageId: message._id,
      topic: sentimentRecord.topic,
      score: sentimentRecord.score,
      emotion: sentimentRecord.emotion,
      confidence: sentimentRecord.confidence,
    },
  });
});

/** Get sentiment trends for a city (aggregates chat-driven sentiment). */
export const getSentimentTrendsByCity = catchAsync(async (req, res, next) => {
  const { city, period = "24h" } = req.query;
  if (!city) {
    return next(new AppError("City query parameter is required", 400));
  }
  const { Types } = await import("mongoose");
  let cityDoc;
  if (Types.ObjectId.isValid(city)) {
    cityDoc = await City.findById(city);
  } else {
    cityDoc = await City.findOne({ name: { $regex: new RegExp(`^${city}$`, "i") } });
  }
  if (!cityDoc) {
    return next(new AppError("City not found", 404));
  }
  const data = await getSentimentTrends(cityDoc._id, {
    period: period === "7d" ? "7d" : "24h",
  });
  res.status(200).json({
    status: "success",
    data,
  });
});
