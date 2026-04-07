# Authentication & Email Setup Guide

## Email OTP Configuration (Gmail)

To enable the forgot password and password change OTP features, you need to configure Gmail SMTP:

### Steps:

1. **Create a Gmail App Password:**
   - Go to your [Google Account](https://myaccount.google.com/)
   - Navigate to **Security** tab
   - Enable **2-Step Verification** (if not already enabled)
   - Find **App passwords** section
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character app password
   - Copy this password

2. **Update .env file:**
   ```
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

3. **Test:**
   - Go to `/login`
   - Click "Forgot?" button
   - Enter your email address
   - You should receive an OTP email with the code

---

## Google OAuth Configuration

To enable Google Sign-In, follow these steps:

### Steps:

1. **Create a Google OAuth Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google+ API
   - Create OAuth 2.0 Credentials (Web application)
   - Add authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:5174`
     - Your production domain
   - Add authorized redirect URIs:
     - `http://localhost:5173/login`
     - Your production login page

2. **Get Client ID:**
   - Copy your Client ID from the credentials page

3. **Update .env file:**
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

4. **Frontend Setup:**
   - The Google button is currently a placeholder
   - In production, integrate with:
     - Firebase Authentication
     - Google Sign-In Library
   - The backend endpoint `/api/auth/google` accepts an `idToken` from Google

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### POST /api/auth/login
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/google
Login with Google ID token
```json
{
  "idToken": "google-id-token-from-frontend"
}
```

#### POST /api/auth/forgot-password
Request OTP for password reset
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/verify-otp
Verify the OTP
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "forgot-password"
}
```

#### POST /api/auth/reset-password
Reset password with verified OTP
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

#### POST /api/auth/request-otp
Request OTP for password change (requires authentication)
```json
{}
```

#### POST /api/auth/change-password
Change password with OTP (requires authentication)
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "otp": "123456"
}
```

#### GET /api/auth/profile
Get user profile (requires authentication)

#### PUT /api/auth/profile
Update user profile (requires authentication)
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

---

## Features

✅ **forgot Password Flow:**
- User enters email → Receives OTP → Verifies OTP → Resets password

✅ **Password Change (in Settings):**
- User enters current password → Requests OTP → Enters OTP → Changes password

✅ **Google Authentication:**
- Backend ready to accept Google ID tokens
- Frontend integration needed

✅ **Email Security:**
- OTP expires after 10 minutes
- Auto-deletes from database after expiry
- Cannot reuse same OTP

---

## Testing without Email Setup

If you haven't set up Gmail credentials yet, the application will:
- Start successfully
- Show error messages when trying to send emails
- All other features work normally

To test OTP features:
1. Set up Gmail credentials in .env
2. Restart the backend server
3. Try forgot password or password change flows
