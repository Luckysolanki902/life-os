import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Register push token
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { pushToken, email, notificationsEnabled } = body;
    
    // Get or create user
    let user = await User.findOne();
    
    if (!user) {
      user = new User({});
    }
    
    // Update notification settings
    if (pushToken !== undefined) {
      user.pushToken = pushToken;
    }
    if (email !== undefined) {
      user.email = email;
    }
    if (notificationsEnabled !== undefined) {
      user.notificationsEnabled = notificationsEnabled;
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings updated',
      settings: {
        pushToken: user.pushToken ? '***registered***' : null,
        email: user.email || null,
        notificationsEnabled: user.notificationsEnabled,
      }
    });
    
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Get current notification settings
export async function GET() {
  try {
    await connectDB();
    
    const user = await User.findOne().lean() as any;
    
    if (!user) {
      return NextResponse.json({
        pushToken: null,
        email: null,
        notificationsEnabled: true,
      });
    }
    
    return NextResponse.json({
      pushToken: user.pushToken ? '***registered***' : null,
      email: user.email || null,
      notificationsEnabled: user.notificationsEnabled ?? true,
    });
    
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}
