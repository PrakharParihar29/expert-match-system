import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    resumeFile: {
      type: String, // Path or filename
      required: true,
    },
    extractedText: {
      type: String,
    },
    keywords: {
      type: [String],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

CandidateSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.models.Candidate ||
  mongoose.model("Candidate", CandidateSchema);
