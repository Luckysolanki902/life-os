import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema({
  reps: { type: Number },
  weight: { type: Number },
  duration: { type: Number }, // in minutes
});

const ExerciseLogSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // Normalized to midnight
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseDefinition', required: true },
  sets: [SetSchema],
}, { timestamps: true });

ExerciseLogSchema.index({ date: 1, exerciseId: 1 });

export default mongoose.models.ExerciseLog || mongoose.model('ExerciseLog', ExerciseLogSchema);
