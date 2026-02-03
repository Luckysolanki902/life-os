import mongoose from 'mongoose';

const BookDomainSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Psychology, Self-Help, Business, Philosophy
  description: { type: String },
  color: { 
    type: String, 
    default: '#4A90D9' 
  },
  icon: { type: String, default: '📚' }, // Emoji icon
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for performance
BookDomainSchema.index({ order: 1 });

export default mongoose.models.BookDomain || mongoose.model('BookDomain', BookDomainSchema);
