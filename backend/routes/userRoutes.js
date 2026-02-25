import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ==========================================
// 1. USER REGISTRATION
// ==========================================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address, wardNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Email already registered. Please login instead." 
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password, // In production, hash this with bcrypt
            phone: phone || "",
            address: address || "",
            wardNumber: wardNumber || ""
        });

        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: "Registration successful! You can now login.",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during registration" 
        });
    }
});

// ==========================================
// 2. USER LOGIN
// ==========================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Simple password check (in production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Login successful
        res.json({ 
            success: true, 
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                wardNumber: user.wardNumber
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during login" 
        });
    }
});

// ==========================================
// 3. GET USER PROFILE
// ==========================================
router.get("/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error fetching user profile" 
        });
    }
});

// ==========================================
// 4. GET ALL USERS (For debugging)
// ==========================================
router.get("/list", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

export default router;
