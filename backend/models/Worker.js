import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  assignedWard: { type: String, required: true },
  specialization: { type: String, default: "General" },
  isActive: { type: Boolean, default: true },
  tasksCompleted: { type: Number, default: 0 },
  tasksInProgress: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Worker", workerSchema);
