import mongoose, { Schema } from "mongoose";

const LearningSkillSchema = new Schema(
  {
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "LearningArea",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.LearningSkill ||
  mongoose.model("LearningSkill", LearningSkillSchema);
