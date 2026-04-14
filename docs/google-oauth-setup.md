# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth authentication for login and registration in the application.

## Prerequisites
- Google Cloud Console account
- Application running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name: Your application name
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes (optional for basic auth):
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as application type
4. Configure the OAuth client:
   - Name: Your app name (e.g., "Spinofy Feedback Insights")
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page: `http://localhost:3000/auth/login`
3. Click "Sign In with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your application

## How It Works

### Login Flow
1. User clicks "Sign In with Google" button
2. User is redirected to Google OAuth consent screen
3. User authorizes the application
4. Google redirects back with authorization code
5. NextAuth exchanges code for user information
6. User is logged in and redirected to dashboard

### Registration Flow
1. User clicks "Sign Up with Google" button
2. Same OAuth flow as login
3. If user doesn't exist, NextAuth automatically creates a new user account
4. User is logged in and redirected to dashboard

### Account Linking
The configuration includes `allowDangerousEmailAccountLinking: true`, which means:
- If a user signs up with email/password and later uses Google OAuth with the same email, the accounts will be linked
- This provides a seamless experience but requires email verification to be secure

## Database Schema

The Prisma schema already includes the necessary tables:
- `User`: Stores user information
- `Account`: Stores OAuth provider information (Google, etc.)
- `Session`: Stores active sessions

## Security Considerations

1. **Never commit credentials**: Keep `.env` file in `.gitignore`
2. **Use HTTPS in production**: OAuth requires secure connections
3. **Rotate secrets regularly**: Update client secrets periodically
4. **Limit scopes**: Only request necessary permissions
5. **Email verification**: The `allowDangerousEmailAccountLinking` requires proper email verification

## Troubleshooting

### "Redirect URI mismatch" error
- Ensure the redirect URI in Google Console exactly matches your callback URL
- Check for trailing slashes and protocol (http vs https)

### "Access blocked" error
- Verify OAuth consent screen is properly configured
- Check if your email is added to test users (for apps in testing mode)

### User not created in database
- Check database connection
- Verify Prisma schema is up to date: `npm run db:push`
- Check server logs for errors

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Adapter Documentation](https://authjs.dev/reference/adapter/prisma)
