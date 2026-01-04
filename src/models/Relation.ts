import mongoose from "mongoose";

const RelationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., Partner, Family, Friend, Colleague
    description: { type: String },
    icon: { type: String, default: "👤" }, // Emoji icon
    color: {
      type: String,
      enum: ["rose", "purple", "blue", "emerald", "amber", "cyan"],
      default: "blue",
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Relation ||
  mongoose.model("Relation", RelationSchema);
