import mongoose from 'mongoose';

const ExerciseDefinitionSchema = new mongoose.Schema({
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthPage', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['reps', 'duration', 'distance'], default: 'reps' },
  targetMuscles: [{ type: String }], // e.g., 'chest', 'triceps'
  order: { type: Number, default: 0 },
  // Initial recommended values (shown only when no log exists)
  initialSets: { type: Number, default: null },
  initialReps: { type: Number, default: null },
  recommendedWeight: { type: Number, default: null }, // 0 for bodyweight, else kg
}, { timestamps: true });

export default mongoose.models.ExerciseDefinition || mongoose.model('ExerciseDefinition', ExerciseDefinitionSchema);
