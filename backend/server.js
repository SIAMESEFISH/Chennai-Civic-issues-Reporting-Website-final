import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

import complaintRoutes from "./routes/complaintRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

dns.setServers(["8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is working");
});

// Existing complaint routes
app.use("/api/complaints", complaintRoutes);

// User registration/login routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Atlas connected");
    })
    .catch((err) => {
        console.error("❌ MongoDB Atlas connection error:", err);
    });

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});