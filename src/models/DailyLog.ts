import mongoose from "mongoose";

const DailyLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoutineTask",
      required: true,
    },
    date: { type: Date, required: true }, // Normalized to midnight
    completedAt: { type: Date }, // Timestamp of completion
    skippedAt: { type: Date }, // Timestamp of skip
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
    },
    pointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one log per task per day
DailyLogSchema.index({ taskId: 1, date: 1 }, { unique: true });
DailyLogSchema.index({ date: -1 });
DailyLogSchema.index({ status: 1, date: -1 });

export default mongoose.models.DailyLog ||
  mongoose.model("DailyLog", DailyLogSchema);
