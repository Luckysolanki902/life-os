import mongoose from 'mongoose';

const SyncStateSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  lastSync: { type: Date, default: Date.now },
  needsUpdate: { type: Boolean, default: false },
  collections: {
    type: Map,
    of: { type: Date }
  }
}, { timestamps: true });

export default mongoose.models.SyncState || mongoose.model('SyncState', SyncStateSchema);
