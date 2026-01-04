import mongoose from 'mongoose';

const MoodLogSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true }, // Normalized to midnight UTC
  mood: { 
    type: String, 
    enum: ['great', 'good', 'okay', 'low', 'bad'], 
    required: true 
  },
  note: { type: String, maxlength: 200 }, // Optional short note
}, { timestamps: true });

export default mongoose.models.MoodLog || mongoose.model('MoodLog', MoodLogSchema);
