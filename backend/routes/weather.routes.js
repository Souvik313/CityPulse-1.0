import { Router } from "express";
import { fetchAndStoreWeather, getLatestWeatherByCity, getWeatherHistory, getWeatherTrends } from "../controllers/weather.controller.js";
const weatherRouter = Router();

weatherRouter.post("/fetch", fetchAndStoreWeather);
weatherRouter.get("/latest", getLatestWeatherByCity);
weatherRouter.get("/history", getWeatherHistory);
weatherRouter.get("/trends", getWeatherTrends);

export default weatherRouter;