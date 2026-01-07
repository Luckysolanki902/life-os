import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import nodemailer from 'nodemailer';

// Types
interface ScheduledTask {
  _id: string;
  title: string;
  domainId: string;
  startTime?: string;
  endTime?: string;
  recurrenceType?: string;
  recurrenceDays?: number[];
}

interface UserDocument {
  email?: string;
  pushToken?: string;
  notificationsEnabled?: boolean;
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // App password for Gmail
  },
});

// Send email notification
async function sendEmailNotification(email: string, task: ScheduledTask) {
  if (!email || !process.env.SMTP_EMAIL) return;
  
  try {
    await transporter.sendMail({
      from: `"LifeOS" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `⏰ Time for: ${task.title}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border-radius: 16px; padding: 24px; color: white;">
            <h2 style="margin: 0 0 8px 0; font-size: 20px;">🔔 Scheduled Task</h2>
            <p style="margin: 0; color: #888; font-size: 14px;">It's time for your routine!</p>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 16px;">
              <h3 style="margin: 0 0 4px 0; font-size: 18px;">${task.title}</h3>
              <p style="margin: 0; color: #888; font-size: 13px; text-transform: capitalize;">
                ${task.domainId} • ${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''}
              </p>
            </div>
            
            <p style="margin: 16px 0 0 0; color: #666; font-size: 12px; text-align: center;">
              From LifeOS - Build your better version 🚀
            </p>
          </div>
        </div>
      `,
    });
    console.log(`Email sent to ${email} for task: ${task.title}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Send FCM push notification
async function sendPushNotification(pushToken: string, task: ScheduledTask) {
  if (!pushToken || !process.env.FCM_SERVER_KEY) return;
  
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        notification: {
          title: `⏰ ${task.title}`,
          body: `Time for your ${task.domainId} routine!`,
          icon: '/favicon.ico',
          click_action: 'https://lifeosm.vercel.app/routine',
        },
        data: {
          taskId: task._id.toString(),
          domain: task.domainId,
          url: '/routine',
        },
      }),
    });
    
    if (response.ok) {
      console.log(`Push notification sent for task: ${task.title}`);
    } else {
      console.error('FCM error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await connectDB();
    
    // Get current time in IST (Asia/Kolkata)
    const now = new Date();
    const istTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
    
    // Round to nearest :00 or :30
    const [hours, minutes] = istTime.split(':').map(Number);
    const roundedMinutes = minutes >= 15 && minutes < 45 ? 30 : 0;
    const currentSlot = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    
    console.log(`Checking notifications for time slot: ${currentSlot} (IST: ${istTime})`);
    
    // Find tasks scheduled for this time
    const scheduledTasks = await Task.find({
      isActive: true,
      isScheduled: true,
      notificationsEnabled: true,
      startTime: currentSlot,
    }).lean();
    
    if (scheduledTasks.length === 0) {
      return NextResponse.json({ 
        message: 'No scheduled tasks for this time slot',
        timeSlot: currentSlot,
        checked: true 
      });
    }
    
    // Get user for notification preferences
    const user = await User.findOne().lean() as UserDocument | null;
    
    if (!user || !user.notificationsEnabled) {
      return NextResponse.json({ 
        message: 'Notifications disabled',
        checked: true 
      });
    }
    
    // Check day of week for recurrence
    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short'
    }).format(now);
    const dayMap: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    const currentDayNum = dayMap[dayOfWeek] ?? 0;
    
    // Filter tasks based on recurrence
    const tasksToNotify = scheduledTasks.filter((task) => {
      const t = task as ScheduledTask;
      const recurrenceType = t.recurrenceType || 'daily';
      switch (recurrenceType) {
        case 'daily': return true;
        case 'weekdays': return currentDayNum >= 1 && currentDayNum <= 5;
        case 'weekends': return currentDayNum === 0 || currentDayNum === 6;
        case 'custom': return (t.recurrenceDays || []).includes(currentDayNum);
        default: return true;
      }
    }) as ScheduledTask[];
    
    // Send notifications
    const notificationPromises = tasksToNotify.map(async (task) => {
      const promises = [];
      
      if (user?.email) {
        promises.push(sendEmailNotification(user.email, task));
      }
      
      if (user?.pushToken) {
        promises.push(sendPushNotification(user.pushToken, task));
      }
      
      return Promise.all(promises);
    });
    
    await Promise.all(notificationPromises);
    
    return NextResponse.json({
      message: `Sent notifications for ${tasksToNotify.length} tasks`,
      timeSlot: currentSlot,
      tasks: tasksToNotify.map((t) => t.title),
      checked: true
    });
    
  } catch (error) {
    console.error('Notification check error:', error);
    return NextResponse.json(
      { error: 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
