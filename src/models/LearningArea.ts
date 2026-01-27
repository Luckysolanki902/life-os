import mongoose, { Schema } from "mongoose";

const LearningAreaSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // emoji or icon name
    color: { type: String, default: "blue" }, // for visual distinction
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
LearningAreaSchema.index({ order: 1 });

export default mongoose.models.LearningArea ||
  mongoose.model("LearningArea", LearningAreaSchema);
