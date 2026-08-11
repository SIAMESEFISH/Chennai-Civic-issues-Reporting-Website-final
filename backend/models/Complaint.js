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
  reportedBy: {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" }
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
    fieldImages: { type: [String], default: [] },
    resolvedImage: { type: String, default: "" },
    resolvedImageUploadedAt: { type: Date, default: null },
    userVerification: {
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      verifiedByUserId: { type: String, default: "" },
      verifiedByName: { type: String, default: "" },
      note: { type: String, default: "" }
    }
  }
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);
