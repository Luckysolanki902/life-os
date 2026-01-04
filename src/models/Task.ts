import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  domainId: { 
    type: String, 
    enum: ['health', 'career', 'learning', 'social'],
    required: true 
  },
  order: { type: Number, default: 0 },
  isScheduled: { type: Boolean, default: false },
  startTime: { type: String }, // HH:mm
  endTime: { type: String }, // HH:mm
  notificationsEnabled: { type: Boolean, default: true },
  timeOfDay: { 
    type: String, 
    enum: ['none', 'morning', 'afternoon', 'evening', 'night', 'day'],
    default: 'none' 
  },
  basePoints: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }, // Soft delete
  // Recurrence fields
  recurrenceType: { 
    type: String, 
    enum: ['daily', 'weekdays', 'weekends', 'custom'],
    default: 'daily' 
  },
  // Array of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
  // Only used when recurrenceType is 'custom'
  recurrenceDays: { 
    type: [Number], 
    default: [] 
  },
}, { timestamps: true });

// Use 'RoutineTask' to avoid caching collisions with previous 'Task' models
export default mongoose.models.RoutineTask || mongoose.model('RoutineTask', TaskSchema);
