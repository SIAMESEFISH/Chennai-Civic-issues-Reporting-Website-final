import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

// ==========================================
// 1. ADMIN LOGIN
// ==========================================
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find admin by username
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid username or password" 
            });
        }

        // Simple password check (in production, use bcrypt)
        if (admin.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid username or password" 
            });
        }

        // Login successful
        res.json({ 
            success: true, 
            message: "Login successful",
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                wardNumber: admin.wardNumber
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
// 2. CREATE ADMIN (First-time setup)
// ==========================================
router.post("/register", async (req, res) => {
    try {
        const { username, password, email, wardNumber } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin with this username or email already exists" 
            });
        }

        // Create new admin
        const newAdmin = new Admin({
            username,
            password, // In production, hash this with bcrypt
            email,
            wardNumber: wardNumber || ""
        });

        await newAdmin.save();

        res.status(201).json({ 
            success: true, 
            message: "Admin account created successfully",
            admin: {
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email
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
// 3. VERIFY SESSION (CHECK IF LOGGED IN)
// ==========================================
router.get("/verify", async (req, res) => {
    // For client-side session check
    res.json({ success: true, message: "Verification endpoint" });
});

// ==========================================
// 4. GET ALL ADMINS (For debugging)
// ==========================================
router.get("/list", async (req, res) => {
    try {
        const admins = await Admin.find().select("-password");
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: "Error fetching admins" });
    }
});

export default router;
