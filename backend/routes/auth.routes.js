import { Router } from "express";
import { signUp , signIn , signOut } from "../controllers/auth.controller.js";

const authRouter = Router();
authRouter.post("/signup" , signUp);
authRouter.post("/signIn" , signIn);
authRouter.post("/signOut" , signOut);

export default authRouter;