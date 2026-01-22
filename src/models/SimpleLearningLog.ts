import mongoose, { Schema } from "mongoose";

const SimpleLearningLogSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "LearningCategory",
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: "LearningSkill",
      required: true,
    },
    date: { type: Date, required: true },
    duration: { type: Number, required: true }, // in minutes
  },
  { timestamps: true }
);

// Index for efficient queries
SimpleLearningLogSchema.index({ categoryId: 1, date: -1 });
SimpleLearningLogSchema.index({ date: -1 });
SimpleLearningLogSchema.index({ skillId: 1, date: -1 });

export default mongoose.models.SimpleLearningLog ||
  mongoose.model("SimpleLearningLog", SimpleLearningLogSchema);
