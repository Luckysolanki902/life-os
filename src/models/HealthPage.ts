import mongoose from 'mongoose';

const HealthPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.models.HealthPage || mongoose.model('HealthPage', HealthPageSchema);
