import mongoose from 'mongoose';

const InteractionLogSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  date: { type: Date, required: true },
  context: { 
    type: String, 
    enum: ['call', 'chat', 'meet', 'video', 'other'],
    default: 'chat' 
  },
  emotionalTone: { 
    type: String, 
    enum: ['calm', 'tense', 'happy', 'sad', 'neutral', 'frustrated', 'excited'],
    default: 'neutral' 
  },
  yourBehavior: { 
    type: String, 
    enum: ['reactive', 'patient', 'present', 'distracted', 'supportive', 'defensive'],
    default: 'present' 
  },
  insight: { type: String }, // What went well / wrong
  nextIntention: { type: String }, // What to do better next time
}, { timestamps: true });

export default mongoose.models.InteractionLog || mongoose.model('InteractionLog', InteractionLogSchema);
