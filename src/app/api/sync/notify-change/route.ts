import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SyncState from '@/models/SyncState';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sourceDeviceId, collections } = await request.json();
    
    if (!sourceDeviceId) {
      return NextResponse.json({ error: 'Source device ID required' }, { status: 400 });
    }
    
    await connectDB();
    
    // Mark ALL OTHER devices as needing update
    await SyncState.updateMany(
      { deviceId: { $ne: sourceDeviceId } },
      { 
        $set: { 
          needsUpdate: true,
          lastSync: new Date()
        }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notify change error:', error);
    return NextResponse.json({ error: 'Failed to notify change' }, { status: 500 });
  }
}
