# Push Notifications Setup

## Environment Variables

Add these to your Vercel project settings:

```env
# Email Notifications (Gmail)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use Gmail App Password, not regular password

# Firebase Cloud Messaging (for Android push)
FCM_SERVER_KEY=your-fcm-server-key

# Cron Job Security (optional but recommended)
CRON_SECRET=your-random-secret-string
```

## Setup Steps

### 1. Gmail App Password
1. Go to your Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Create new app password for "Mail"
4. Use this password as `SMTP_PASSWORD`

### 2. Firebase Cloud Messaging (FCM)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Project Settings → Cloud Messaging
4. Copy the Server Key (or generate one)
5. Use this as `FCM_SERVER_KEY`

### 3. Android Setup
1. Download `google-services.json` from Firebase
2. Place it in `android/app/`
3. Run `npx cap sync android`

### 4. Vercel Cron Jobs
The cron job is configured in `vercel.json` to run every :00 and :30 minutes.
This checks for scheduled tasks and sends notifications.

## API Endpoints

### Check Notifications (Cron)
```
GET /api/notifications/check
```
Called automatically by Vercel cron. Checks for scheduled tasks and sends notifications.

### Notification Settings
```
GET /api/notifications/settings
POST /api/notifications/settings
```
- GET: Returns current notification settings
- POST: Update push token, email, or notification preferences

Body:
```json
{
  "pushToken": "fcm-token-from-device",
  "email": "user@example.com",
  "notificationsEnabled": true
}
```

## How It Works

1. **Cron Job**: Runs every 30 minutes on Vercel
2. **Task Check**: Finds tasks scheduled for current time slot (rounded to :00 or :30)
3. **Recurrence Filter**: Only notifies for tasks matching today's recurrence
4. **Notification Types**:
   - **Email**: Using Nodemailer + Gmail
   - **Push**: Using FCM for Android

## Testing

Test the notification endpoint locally:
```bash
curl http://localhost:3000/api/notifications/check
```

Or trigger manually on Vercel by visiting:
```
https://your-app.vercel.app/api/notifications/check
```
