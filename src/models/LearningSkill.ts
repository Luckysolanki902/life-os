import mongoose, { Schema } from "mongoose";

const LearningSkillSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "LearningCategory",
      required: true,
    },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for efficient queries
LearningSkillSchema.index({ categoryId: 1, order: 1 });
LearningSkillSchema.index({ name: 1 });

export default mongoose.models.LearningSkill ||
  mongoose.model("LearningSkill", LearningSkillSchema);
