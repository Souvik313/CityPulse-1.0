import { Router } from "express";
import { analyzeText, analyzeChatSentiment, getSentimentTrendsByCity } from "../controllers/sentiment.controller.js";
const sentimentRouter = Router();

sentimentRouter.post("/analyze", analyzeChatSentiment);
sentimentRouter.post("/analyze-text", analyzeText);
sentimentRouter.get("/trends", getSentimentTrendsByCity);
export default sentimentRouter;