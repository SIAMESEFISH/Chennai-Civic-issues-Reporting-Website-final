import express from "express";
import Worker from "../models/Worker.js";
import Complaint from "../models/Complaint.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// ================================
// MULTER CONFIGURATION (WORKER UPLOADS)
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ================================
// ADMIN: CREATE WORKER (Registration)
// ================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, assignedWard, specialization } = req.body;

    // Check if worker email already exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ message: "Worker email already exists" });
    }

    // Generate unique worker ID
    const workerCount = await Worker.countDocuments();
    const workerId = `WKR-${String(workerCount + 1).padStart(4, '0')}`;

    const worker = new Worker({
      workerId,
      name,
      email,
      password, // In production, hash this password
      phone,
      assignedWard,
      specialization: specialization || "General"
    });

    await worker.save();
    res.json({ 
      message: "Worker registered successfully", 
      workerId: worker.workerId,
      worker: {
        workerId: worker.workerId,
        name: worker.name,
        email: worker.email,
        assignedWard: worker.assignedWard
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// WORKER LOGIN
// ================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const worker = await Worker.findOne({ email });
    
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (worker.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (!worker.isActive) {
      return res.status(403).json({ message: "Worker account is deactivated" });
    }

    res.json({
      message: "Login successful",
      worker: {
        workerId: worker.workerId,
        name: worker.name,
        email: worker.email,
        assignedWard: worker.assignedWard,
        specialization: worker.specialization,
        tasksCompleted: worker.tasksCompleted,
        tasksInProgress: worker.tasksInProgress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET ALL WORKERS (Admin Only)
// ================================
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET WORKER BY ID
// ================================
router.get("/:workerId", async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.workerId });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET WORKER'S ASSIGNED TASKS
// ================================
router.get("/:workerId/tasks", async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await Worker.findOne({ workerId });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Security: Only get tasks assigned to this worker
    // We check wardNumber OR area to match worker's assigned ward for backward compatibility
    const tasks = await Complaint.find({
      "assignedTo.workerId": workerId
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// UPDATE WORKER STATUS (Admin Only)
// ================================
router.put("/:workerId", async (req, res) => {
  try {
    const { isActive, assignedWard, specialization } = req.body;
    
    const worker = await Worker.findOneAndUpdate(
      { workerId: req.params.workerId },
      { isActive, assignedWard, specialization },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.json({ message: "Worker updated successfully", worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// WORKER: UPDATE TASK PROGRESS
// ================================
router.put("/tasks/:complaintId/progress", upload.single("resolvedImage"), async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { workerId, status, workerNotes } = req.body;

    const complaint = await Complaint.findOne({ complaintId });
    if (!complaint) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Security: Verify worker is assigned to this task
    if (complaint.assignedTo?.workerId !== workerId) {
      return res.status(403).json({ message: "Unauthorized: Task not assigned to you" });
    }

    const worker = await Worker.findOne({ workerId });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Update task progress
    if (status === "In Progress" && !complaint.workProgress.startedAt) {
      complaint.workProgress.startedAt = new Date();
    }

    if (status === "Resolved") {
      if (!req.file && !complaint.workProgress?.resolvedImage) {
        return res.status(400).json({ message: "Resolved photo is required before completing the task" });
      }

      complaint.workProgress.completedAt = new Date();
      if (req.file) {
        complaint.workProgress.resolvedImage = req.file.filename;
        complaint.workProgress.resolvedImageUploadedAt = new Date();
      }
      complaint.workProgress.userVerification = {
        verified: false,
        verifiedAt: null,
        verifiedByUserId: "",
        verifiedByName: "",
        note: ""
      };
      worker.tasksCompleted += 1;
      worker.tasksInProgress = Math.max(0, worker.tasksInProgress - 1);
      await worker.save();
    } else if (status === "In Progress" && complaint.status === "Pending") {
      worker.tasksInProgress += 1;
      await worker.save();
    }

    complaint.status = status;
    complaint.workProgress.workerNotes = workerNotes || complaint.workProgress.workerNotes;
    
    await complaint.save();

    res.json({ 
      message: "Task updated successfully", 
      complaint 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// DELETE WORKER (Admin Only)
// ================================
router.delete("/:workerId", async (req, res) => {
  try {
    const worker = await Worker.findOneAndDelete({ workerId: req.params.workerId });
    
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Unassign all tasks from this worker
    await Complaint.updateMany(
      { "assignedTo.workerId": req.params.workerId },
      { $set: { "assignedTo": { workerId: null, workerName: null, assignedAt: null, assignedBy: null } } }
    );

    res.json({ message: "Worker deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
