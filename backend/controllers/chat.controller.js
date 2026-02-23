import ChatSession from "../models/ChatSession.model.js";
import ChatMessage from "../models/ChatMessage.model.js";
import SentimentRecord from "../models/SentimentRecord.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import City from "../models/city.model.js";
import { analyzeSentiment } from "../services/sentiment.service.js";
import { getIO } from "../utils/socket.js";
import { v4 as uuidv4 } from "uuid";
import { generateAIReply } from "../utils/ai.js";

// Start a new chat session controller
export const startChatSession = catchAsync(async (req, res, next) => {
  const { cityId } = req.body;

  if (!cityId) {
    return next(new AppError("cityId is required", 400));
  }

  const sessionId = uuidv4();
  const existingSession = await ChatSession.findOne({
    sessionId,
    status: "active"
  });
  if (existingSession) {
    return res.status(200).json({
      success: true,
      data: existingSession
    });
  }
  const session = await ChatSession.create({
    user: req.user._id,
    city: cityId,
    sessionId
  });
  res.status(201).json({
    success: true,
    data: session
  });
});

// Send chat message controller
export const sendMessage = catchAsync(async (req, res, next) => {
  const { sessionId, message, sender = 'user' } = req.body;

  if (!sessionId || !message) {
    return next(new AppError("sessionId and message are required", 400));
  }

  const session = await ChatSession.findOne({ sessionId, status: 'active' });
  if (!session) {
    return next(new AppError("Active chat session not found", 404));
  }

  // Save user message
  const chatMessage = await ChatMessage.create({
    session: session._id,
    sender,
    content: message
  });
  session.messageCount += 1;
  await session.save();

  // Sentiment analysis on user message
  let sentimentResult = null;
  if (sender === 'user' && message.length >= 5) {
    sentimentResult = await analyzeSentiment(message);
    if (sentimentResult && sentimentResult.confidence >= 0.6) {
      await SentimentRecord.create({
        city: session.city,
        session: session._id,
        source: 'chatbot',
        topic: sentimentResult.topic,
        score: sentimentResult.score,
        emotion: sentimentResult.emotion,
        confidence: sentimentResult.confidence
      });
    }
  }

  // Generate and save AI reply
  let botMessage = null;
  if (sender === 'user') {
    try {
      const city = await City.findById(session.city).select('name');
      const aiReply = await generateAIReply(message, city?.name || '');

      botMessage = await ChatMessage.create({
        session: session._id,
        sender: 'bot',
        content: aiReply
      });
      console.log("Bot message saved:", botMessage);
      session.messageCount += 1;
      await session.save();
    } catch (err) {
      console.error('AI reply failed:', err.message);
      // Non-fatal — user message is still saved
    }
  }

  // Emit both messages over socket
  try {
    const io = getIO();
    io.to(session.sessionId).emit('message', chatMessage);
    if (botMessage) io.to(session.sessionId).emit('message', botMessage);
  } catch (err) {
    // non-fatal
  }

  res.status(201).json({
    success: true,
    data: {
      message: chatMessage,
      botMessage,
      sentiment: sentimentResult
    }
  });
});

// End chat session controller
export const endChatSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.body;

  const session = await ChatSession.findOne({
    sessionId,
    status: "active"
  });

  if (!session) {
    return next(new AppError("Active session not found", 404));
  }

  session.status = "ended";
  session.endedAt = new Date();

  await session.save();

  res.status(200).json({
    success: true,
    message: "Chat session ended successfully"
  });
});

// Get chat session messages controller
export const getSessionMessages = catchAsync(async (req, res, next) => {
  const { sessionId } = req.query;
  if(!sessionId){
    return next(new AppError("sessionId query parameter is required", 400));
  }

  // Accept the public sessionId (string) and resolve the DB session document
  const session = await ChatSession.findOne({ sessionId });

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  const messages = await ChatMessage.find({
    session: session._id
  }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    results: messages.length,
    data: messages
  });
});

export const getAllSessionsForUser = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError("Unauthorized", 401));}

    const sessions = await ChatSession.find({ user: userId }).sort({createdAt: -1});
    if(!sessions || sessions.length === 0){
        return res.status(404).json({
          success: false,
          message: "No chat sessions found"
        });
      }
      res.status(200).json({
        success: true,
        message: "Sessions fetched successfully",
        data: sessions,
      })
})
