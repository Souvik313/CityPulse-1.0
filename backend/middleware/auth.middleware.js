import { JWT_SECRET } from "../config/env.js";
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

export const authorize = async (req , res , next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(400).json({ error: "No token found" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: "Unauthorized" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log(error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

