import mongoose, { Schema } from "mongoose";

const PracticeMediumSchema = new Schema(
  {
    skillId: {
      type: Schema.Types.ObjectId,
      ref: "LearningSkill",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // emoji for quick visual
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
PracticeMediumSchema.index({ skillId: 1 });
PracticeMediumSchema.index({ skillId: 1, order: 1 });

export default mongoose.models.PracticeMedium ||
  mongoose.model("PracticeMedium", PracticeMediumSchema);
