import { Router} from "express";
import { authorize } from "../middleware/auth.middleware.js";
import { startChatSession , sendMessage , endChatSession , getSessionMessages, getAllSessionsForUser } from "../controllers/chat.controller.js";
const chatRouter = Router();

chatRouter.post("/start" , authorize , startChatSession);
chatRouter.post("/message" , sendMessage);
chatRouter.post("/end" , endChatSession);
chatRouter.get("/all-sessions", authorize, getAllSessionsForUser);
chatRouter.get("/messages" , getSessionMessages);

export default chatRouter;