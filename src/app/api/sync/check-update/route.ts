import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SyncState from '@/models/SyncState';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }
    
    await connectDB();
    
    const syncState = await SyncState.findOne({ deviceId }).lean();
    
    return NextResponse.json({ 
      needsUpdate: syncState?.needsUpdate || false,
      lastSync: syncState?.lastSync || null
    });
  } catch (error) {
    console.error('Check update error:', error);
    return NextResponse.json({ error: 'Failed to check update' }, { status: 500 });
  }
}
