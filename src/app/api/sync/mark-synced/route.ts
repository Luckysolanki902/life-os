import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SyncState from '@/models/SyncState';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();
    
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }
    
    await connectDB();
    
    // Mark this device as synced (needsUpdate = false)
    await SyncState.findOneAndUpdate(
      { deviceId },
      { 
        $set: { 
          needsUpdate: false,
          lastSync: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark synced error:', error);
    return NextResponse.json({ error: 'Failed to mark synced' }, { status: 500 });
  }
}
