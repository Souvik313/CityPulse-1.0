import { Router } from "express";
import { fetchAndStoreTraffic , getLatestTrafficByCity , getTrafficHistory } from "../controllers/traffic.controller.js";
const trafficRouter = Router();

trafficRouter.post("/fetch" , fetchAndStoreTraffic);
trafficRouter.get("/latest" , getLatestTrafficByCity);
trafficRouter.get("/history" , getTrafficHistory);

export default trafficRouter;