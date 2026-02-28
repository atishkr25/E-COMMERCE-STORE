import Redis from "ioredis";
import User from "../models/user.model.js";
import {redis} from "../lib/redis.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
} 

const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60); // Store for 7 days
    } catch (error) {
        console.error("Error storing refresh token in Redis:", error);
    }
}   
const setCookie = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true, //prevent XXS attacks cross site scripting
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict', //prevent CSRF attacks cross site request forgery
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}   

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({ name, email, password });

        //authentication
        const {accessToken, refreshToken} = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookie(res, accessToken, refreshToken);

        res.status(201).json({ 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(user && (await user.comparePassword(password))){           
            const {accessToken, refreshToken} = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookie(res, accessToken, refreshToken);
            res.status(200).json({ 
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                message: "Logged in successfully" });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "error in login controler ", error:error.message });
    }
};

export const logout = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decoded.userId}`);
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "error in logout controller", error:error.message });
    }
};

// Refresh Token - Generate new access token using refresh token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Check if refresh token exists in Redis
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);
        
        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
        
        // Store new refresh token in Redis
        await storeRefreshToken(decoded.userId, newRefreshToken);
        
        // Set new cookies
        setCookie(res, accessToken, newRefreshToken);
        
        res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.error("Error in refresh token:", error);
        res.status(401).json({ message: "Invalid or expired refresh token", error: error.message });
    }
};