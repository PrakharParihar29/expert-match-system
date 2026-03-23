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
      unique: true,
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

export default mongoose.models.Candidate ||
  mongoose.model("Candidate", CandidateSchema);
