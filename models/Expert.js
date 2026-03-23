import mongoose from "mongoose";

const ExpertSchema = new mongoose.Schema(
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
    expertiseKeywords: {
      type: [String],
      required: true,
    },
    experienceYears: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Expert || mongoose.model("Expert", ExpertSchema);
