import {Router} from "express";
import { getAllUsers , getUserById , createNewUser , updateUserData, deleteUserById , deleteAllUsers } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/" , getAllUsers);
userRouter.get("/:id" , getUserById);
userRouter.post("/" , createNewUser);
userRouter.patch("/:id" , updateUserData);
userRouter.delete("/:id" , deleteUserById);
userRouter.delete("/" , deleteAllUsers);

export default userRouter;
