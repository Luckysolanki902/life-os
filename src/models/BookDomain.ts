import mongoose from 'mongoose';

const BookDomainSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Psychology, Self-Help, Business, Philosophy
  description: { type: String },
  color: { 
    type: String, 
    enum: ['blue', 'purple', 'emerald', 'orange', 'rose', 'cyan', 'amber', 'indigo'],
    default: 'blue' 
  },
  icon: { type: String, default: '📚' }, // Emoji icon
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.BookDomain || mongoose.model('BookDomain', BookDomainSchema);
