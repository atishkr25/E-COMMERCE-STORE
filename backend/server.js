// const express = require('express') : instead of using this we user this⬇️

import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.route.js' ;
import profileRoutes from './routes/profile.route.js' ;
import mongoose from 'mongoose';
import connectDB from './lib/db.js';

dotenv.config();
const app = express();


// console.log(process.env.PORT);
const PORT = process.env.PORT || 5001;

app.use(express.json());  //middleware to parse incoming JSON data
app.use(cookieParser());  //middleware to parse cookies

//routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

//mongodb connection
connectDB();

app.listen(PORT, () => {
    console.log("server is started at port", PORT);
})