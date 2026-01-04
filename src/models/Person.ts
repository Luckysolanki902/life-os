import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  relationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Relation', required: true },
  name: { type: String, required: true }, // e.g., Sunshine, Co-founder
  nickname: { type: String }, // Optional nickname
  notes: { type: String }, // Any notes about this person
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Person || mongoose.model('Person', PersonSchema);
