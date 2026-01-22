import mongoose from 'mongoose';

const BookLogSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  date: { type: Date, required: true },
  currentPage: { type: Number, default: 0 },
  pagesRead: { type: Number, default: 0 }, // pages read this session
  notes: { type: String },
}, { timestamps: true });

// Indexes for efficient queries
BookLogSchema.index({ bookId: 1, date: -1 });
BookLogSchema.index({ date: -1 });

export default mongoose.models.BookLog || mongoose.model('BookLog', BookLogSchema);
