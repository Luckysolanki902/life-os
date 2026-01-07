# Push Notifications Setup

## Environment Variables

Add these to your Vercel project settings:

```env
# Email Notifications (Gmail)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use Gmail App Password, not regular password

# Firebase Cloud Messaging V1 API (from service account JSON)
FCM_PROJECT_ID=lifeos-5e2b2
FCM_CLIENT_EMAIL=firebase-adminsdk-fbsvc@lifeos-5e2b2.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Cron Job Security (optional but recommended)
CRON_SECRET=your-random-secret-string
```

## Setup Steps

### 1. Gmail App Password
1. Go to your Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Create new app password for "Mail"
4. Use this password as `SMTP_PASSWORD`

### 2. Firebase Cloud Messaging (FCM V1 API)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Click "Generate new private key" → Download JSON
4. From the JSON file, copy these values to Vercel env vars:
   - `project_id` → `FCM_PROJECT_ID`
   - `client_email` → `FCM_CLIENT_EMAIL`
   - `private_key` → `FCM_PRIVATE_KEY` (keep the quotes and \n characters)

### 3. Android Setup
1. Download `google-services.json` from Firebase (Project Settings → Your Apps)
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
