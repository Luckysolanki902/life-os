import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, default: 'Admin' },
  profile: {
    height: { type: Number, default: 183 }, // cm (default ~6ft)
    dob: { type: Date, default: new Date('2002-09-14') },
    startWeight: { type: Number, default: 50 },
    goalWeight: { type: Number, default: 65 },
  },
  totalPoints: { type: Number, default: 0 },
  pointsBreakdown: {
    health: { type: Number, default: 0 },
    career: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    startups: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
  }
}, { timestamps: true });

// Singleton pattern for the single user app
export default mongoose.models.User || mongoose.model('User', UserSchema);
