import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  area: { type: String, required: true },
  wardNumber: { type: String, default: "" },
  latitude: { type: String },
  longitude: { type: String },
  description: { type: String, required: true },
  image: { type: String },
  status: {
    type: String,
    default: "Pending"
  },
  reportCount: {
    type: Number,
    default: 1
  },
  sameIssueReports: {
    type: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, default: "" },
        reportedAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  // Worker Assignment Fields
  assignedTo: {
    workerId: { type: String, default: null },
    workerName: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    assignedBy: { type: String, default: null }
  },
  workProgress: {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    workerNotes: { type: String, default: "" },
    fieldImages: { type: [String], default: [] }
  }
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);
