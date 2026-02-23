import { Router } from "express";
import { getCityPulse } from "../controllers/cityPulse.controller.js";
const cityPulseRouter = Router();

cityPulseRouter.get("/" , getCityPulse);
export default cityPulseRouter;