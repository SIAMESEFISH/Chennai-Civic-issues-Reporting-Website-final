
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");

// const complaintRoutes = require("./routes/complaintRoutes");

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes

// app.use("/api/complaints", require("./routes/complaintRoutes"));

// // MongoDB Connection (FREE MongoDB Atlas)
// mongoose.connect("mongodb://127.0.0.1:27017/complaintDB")
// .then(() => console.log("✅ MongoDB Connected"))
// .catch(err => console.log(err));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// // app.listen(5000, () => {
// //     console.log("🚀 Server running on http://localhost:5000");
// // });


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import complaintRoutes from "./routes/complaintRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔥 ADD THIS TEST ROUTE HERE
app.get("/", (req, res) => {
  res.send("Server is working");
});

// Routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/civicDB")
  .then(() => console.log("✅ MongoDB connected (Local)"))
  .catch(err => console.log("❌ DB Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
