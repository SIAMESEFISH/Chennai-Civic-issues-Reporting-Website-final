import express from "express";
import Complaint from "../models/Complaint.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// ================================
// MULTER CONFIGURATION
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ================================
// Generate unique complaint ID
// ================================
function generateComplaintId() {
  return "CC-" + Math.floor(100000 + Math.random() * 900000);
}

// ================================
// CREATE COMPLAINT (WITH IMAGE)
// ================================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const complaint = new Complaint({
      complaintId: generateComplaintId(),
      name: req.body.name,
      category: req.body.category,
      area: req.body.area,
      wardNumber: req.body.wardNumber || "",
      latitude: req.body.latitude || "",
      longitude: req.body.longitude || "",
      description: req.body.description,
      image: req.file ? req.file.filename : "",  // ✅ Image stored here
      reportedBy: {
        userId: req.body.userId || "",
        name: req.body.name || "",
        email: req.body.userEmail || ""
      }
    });

    await complaint.save();

    res.json({ complaintId: complaint.complaintId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET ALL COMPLAINTS
// ================================
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// TRACK COMPLAINT
// ================================
router.get("/track/:complaintId", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      complaintId: req.params.complaintId
    });

    if (!complaint)
      return res.status(404).json({ message: "Not found" });

    res.json({
      status: complaint.status,
      category: complaint.category,
      area: complaint.area,
      wardNumber: complaint.wardNumber,
      reportCount: complaint.reportCount,
      complaintId: complaint.complaintId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// REPORT SAME ISSUE
// ================================
router.put("/report-same/:id", async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ message: "User information is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    const hasReported = Array.isArray(complaint.sameIssueReports)
      && complaint.sameIssueReports.some((r) => r.userId === userId);

    if (hasReported) {
      return res.status(409).json({ message: "You have already reported this issue" });
    }

    complaint.sameIssueReports = Array.isArray(complaint.sameIssueReports)
      ? complaint.sameIssueReports
      : [];

    complaint.reportCount += 1;
    complaint.sameIssueReports.push({
      userId,
      name,
      email: email || "",
      reportedAt: new Date()
    });
    await complaint.save();

    res.json({ reportCount: complaint.reportCount, message: "Reported successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// UPDATE STATUS
// ================================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Complaint not found" });

    res.json({ status: updated.status });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// USER VERIFY RESOLUTION (WITH PROOF)
// ================================
router.put("/:id/verify-resolution", async (req, res) => {
  try {
    const { userId, userName, note } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== "Resolved") {
      return res.status(400).json({ message: "Only resolved complaints can be verified" });
    }

    if (!complaint.workProgress?.resolvedImage) {
      return res.status(400).json({ message: "Resolution proof image is not uploaded yet" });
    }

    complaint.workProgress.userVerification = {
      verified: true,
      verifiedAt: new Date(),
      verifiedByUserId: userId || "",
      verifiedByName: userName || "",
      note: note || ""
    };

    await complaint.save();

    res.json({
      message: "Resolution verified successfully",
      verification: complaint.workProgress.userVerification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// DELETE RESOLVED COMPLAINT
// ================================
router.delete("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    if (complaint.status !== "Resolved") {
      return res.status(403).json({
        message: "Only resolved complaints can be deleted"
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({ message: "Complaint deleted successfully" });

  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// ================================
// GET WARD-BASED STATISTICS
// ================================
router.get("/analytics/ward-stats", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    
    // Group complaints by area/ward
    const wardStats = {};
    
    complaints.forEach(complaint => {
      const ward = complaint.area || "Unknown";
      
      if (!wardStats[ward]) {
        wardStats[ward] = {
          ward: ward,
          total: 0,
          pending: 0,
          resolved: 0,
          categories: {},
          complaints: []
        };
      }
      
      wardStats[ward].total += 1;
      
      // Count by status
      if (complaint.status === "Resolved") {
        wardStats[ward].resolved += 1;
      } else {
        wardStats[ward].pending += 1;
      }
      
      // Count by category
      const category = complaint.category || "Other";
      wardStats[ward].categories[category] = (wardStats[ward].categories[category] || 0) + 1;
      
      // Add complaint details (for map markers)
      wardStats[ward].complaints.push({
        id: complaint.complaintId,
        category: complaint.category,
        status: complaint.status,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        description: complaint.description
      });
    });
    
    // Convert to array and sort by total complaints
    const wardArray = Object.values(wardStats).sort((a, b) => b.total - a.total);
    
    res.json(wardArray);
  } catch (err) {
    console.error("Ward stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// ASSIGN TASK TO WORKER (Admin Only)
// ================================
router.put("/:id/assign", async (req, res) => {
  try {
    const { workerId, workerName, assignedBy } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = {
      workerId,
      workerName,
      assignedAt: new Date(),
      assignedBy: assignedBy || "Admin"
    };

    await complaint.save();

    res.json({ 
      message: "Task assigned successfully", 
      complaint 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// UNASSIGN TASK (Admin Only)
// ================================
router.put("/:id/unassign", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = {
      workerId: null,
      workerName: null,
      assignedAt: null,
      assignedBy: null
    };

    await complaint.save();

    res.json({ 
      message: "Task unassigned successfully", 
      complaint 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
