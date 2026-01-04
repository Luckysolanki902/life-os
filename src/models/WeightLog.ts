import mongoose from 'mongoose';

const WeightLogSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  weight: { type: Number, required: true }, // in kg
}, { timestamps: true });

// Index for quick lookup by date
WeightLogSchema.index({ date: -1 });

export default mongoose.models.WeightLog || mongoose.model('WeightLog', WeightLogSchema);
