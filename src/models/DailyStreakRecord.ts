import mongoose, { Schema } from "mongoose";

// Streak targets and their bonus points
export const STREAK_TARGETS = [
  { days: 1, points: 5, label: "First Day" },
  { days: 3, points: 15, label: "3 Day Streak" },
  { days: 5, points: 25, label: "5 Day Streak" },
  { days: 7, points: 50, label: "1 Week Streak" },
  { days: 10, points: 75, label: "10 Day Streak" },
  { days: 15, points: 100, label: "15 Day Streak" },
  { days: 20, points: 150, label: "20 Day Streak" },
  { days: 30, points: 250, label: "1 Month Streak" },
  { days: 50, points: 400, label: "50 Day Streak" },
  { days: 75, points: 600, label: "75 Day Streak" },
  { days: 100, points: 1000, label: "100 Day Streak" },
  { days: 150, points: 1500, label: "150 Day Streak" },
  { days: 200, points: 2000, label: "200 Day Streak" },
  { days: 250, points: 2500, label: "250 Day Streak" },
  { days: 300, points: 3000, label: "300 Day Streak" },
  { days: 365, points: 5000, label: "1 Year Streak" },
];

// Daily record to track if streak criteria was met
const DailyStreakRecordSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true }, // Normalized to midnight
    routineTasksCompleted: { type: Number, default: 0 },
    hasExerciseLog: { type: Boolean, default: false },
    streakValid: { type: Boolean, default: false }, // true if >= 5 tasks AND has exercise (or rest day)
    bonusPointsAwarded: { type: Number, default: 0 }, // Streak milestone bonus earned
    milestonesReached: [{ type: Number }], // Array of milestone days reached (e.g., [1, 3, 5])
  },
  { timestamps: true }
);

DailyStreakRecordSchema.index({ date: -1 });
DailyStreakRecordSchema.index({ streakValid: 1, date: -1 });

export default mongoose.models.DailyStreakRecord ||
  mongoose.model("DailyStreakRecord", DailyStreakRecordSchema);
