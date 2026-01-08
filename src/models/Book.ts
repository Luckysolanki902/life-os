import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookDomain', required: true },
  title: { type: String, required: true },
  author: { type: String },
  subcategory: { type: String, required: true }, // e.g., "Marketing", "Validation" for Startups domain
  
  // Status managed by logic
  status: { 
    type: String, 
    enum: ['to-read', 'reading', 'paused', 'completed', 'dropped'],
    default: 'to-read' 
  },
  
  // Dates
  startDate: { type: Date },
  completedDate: { type: Date },
  lastReadDate: { type: Date }, // Updated when checked in
  
  // Progress tracking
  totalPages: { type: Number },
  currentPage: { type: Number, default: 0 },
  
  // Notes
  notes: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for efficient queries
BookSchema.index({ status: 1 });
BookSchema.index({ lastReadDate: -1 });
BookSchema.index({ domainId: 1, status: 1 });

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
