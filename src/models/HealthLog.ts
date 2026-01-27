import mongoose from 'mongoose';

const HealthLogSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['weight', 'exercise', 'diet', 'sleep'] },
  data: {
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' }
    },
    exercise: {
      name: String,
      reps: Number,
      sets: Number,
      durationMin: Number,
      intensity: String
    },
    diet: {
      items: [String],
      waterIntake: Number, // Liters
      proteinIntake: Number // Grams
    },
    sleep: {
      hours: Number,
      quality: { type: String, enum: ['poor', 'good', 'excellent'] }
    }
  },
  pointsEarned: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for performance
HealthLogSchema.index({ date: -1 });
HealthLogSchema.index({ type: 1, date: -1 });

export default mongoose.models.HealthLog || mongoose.model('HealthLog', HealthLogSchema);
