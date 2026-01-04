import mongoose, { Schema } from "mongoose";

const LearningLogSchema = new Schema(
  {
    mediumId: {
      type: Schema.Types.ObjectId,
      ref: "PracticeMedium",
      required: true,
    },
    date: { type: Date, required: true },
    duration: { type: Number, required: true }, // in minutes
    activities: { type: String }, // what was practiced
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "challenging", "hard"],
      default: "moderate",
    },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 }, // session quality rating
  },
  { timestamps: true }
);

// Index for efficient queries
LearningLogSchema.index({ mediumId: 1, date: -1 });

export default mongoose.models.LearningLog ||
  mongoose.model("LearningLog", LearningLogSchema);
