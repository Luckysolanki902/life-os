import mongoose, { Schema } from "mongoose";

const LearningCategorySchema = new Schema(
  {
    title: { type: String, required: true },
    icon: { type: String, default: "📚" }, // emoji for visual
    color: { type: String, default: "violet" }, // for visual distinction
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
LearningCategorySchema.index({ order: 1 });

export default mongoose.models.LearningCategory ||
  mongoose.model("LearningCategory", LearningCategorySchema);
