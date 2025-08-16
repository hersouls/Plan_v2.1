# 🚀 Moonwave Plan Deployment Guide

## Overview

This guide covers the complete deployment process for Moonwave Plan, including Vercel deployment, domain configuration, and Firebase Functions setup.

## 📋 Pre-deployment Checklist

Run the deployment validator before deploying:

```bash
npm run deploy:check
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | ✅ |
| `VITE_FCM_VAPID_KEY` | FCM VAPID key for push notifications | ✅ |
| `VITE_APP_NAME` | Application name | ✅ |
| `VITE_APP_VERSION` | Application version | ✅ |
| `VITE_APP_URL` | Production URL (https://plan.moonwave.kr) | ✅ |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | - |
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | - |
| `VITE_SENTRY_DSN` | Sentry error reporting DSN | - |
| `VITE_ENABLE_PWA` | Enable PWA features | `true` |
| `VITE_ENABLE_NOTIFICATIONS` | Enable push notifications | `true` |

## 🌐 Domain Configuration (plan.moonwave.kr)

### 1. Domain Setup

The application is configured to run on `https://plan.moonwave.kr`:

- **CNAME file**: Already configured in repository root
- **Vercel Domain**: Add `plan.moonwave.kr` as a custom domain in Vercel dashboard
- **DNS Configuration**: Point CNAME record to Vercel's deployment

### 2. DNS Records

Configure the following DNS records with your domain provider:

```
Type: CNAME
Name: plan
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. SSL Certificate

Vercel automatically provides SSL certificates for custom domains. The certificate will be issued within minutes of domain configuration.

## ⚡ Vercel Deployment

### 1. Vercel Project Setup

1. Connect your GitHub repository to Vercel
2. Configure the following settings:
   - **Build Command**: `npm run vercel:build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2. Environment Variables in Vercel

Add all required environment variables in Vercel dashboard:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add each environment variable with appropriate values
3. Ensure variables are enabled for Production, Preview, and Development environments

### 3. Deployment Configuration

The project includes a `vercel.json` configuration with:

- ✅ Static build setup for Vite
- ✅ SPA routing configuration  
- ✅ Security headers (XSS, Frame Options, Content Type)
- ✅ Service Worker headers for FCM
- ✅ PWA manifest headers
- ✅ Static asset caching

### 4. Deploy

```bash
# Production deployment validation
npm run deploy:prod

# Or deploy directly via Vercel CLI
vercel --prod
```

## 🔥 Firebase Configuration

### 1. Firebase Project Setup

Ensure your Firebase project has:

1. **Authentication**: Enabled with Google provider
2. **Firestore**: Database created with proper security rules
3. **Cloud Functions**: Deployed for backend logic
4. **Cloud Messaging**: Configured for push notifications
5. **Storage**: Enabled for file uploads

### 2. Firebase Functions Deployment

```bash
# Deploy Firebase Functions
npm run firebase:deploy

# Or deploy functions only
firebase deploy --only functions
```

### 3. Firestore Security Rules

Update Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Group documents - members can read/write
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.memberIds;
    }
    
    // Task documents - group members can read/write
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
      // Additional security: check group membership
    }
    
    // Activity logs - read-only for group members
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write activities
    }
  }
}
```

## 📱 PWA Configuration

### 1. Service Worker

The application includes a Firebase Cloud Messaging service worker:

- **Location**: `/public/firebase-messaging-sw.js`
- **Purpose**: Handle background push notifications
- **Features**: Notification click handling, task actions

### 2. Web App Manifest

Create or verify `manifest.json` in `/public`:

```json
{
  "name": "Moonwave Plan",
  "short_name": "Plan",
  "description": "가족과 함께하는 스마트한 할일 관리",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8b5cf6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png", 
      "sizes": "375x667",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["productivity", "utilities"],
  "shortcuts": [
    {
      "name": "새 할일 만들기",
      "url": "/tasks/new",
      "description": "새로운 할일을 빠르게 생성",
      "icons": [
        {
          "src": "/icons/shortcut-new-task.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

## 🔒 Security Configuration

### 1. Environment Variables Security

- ✅ Never commit `.env` files to repository
- ✅ Use Vercel environment variables for production
- ✅ Validate all environment variables before deployment
- ✅ Use different Firebase projects for dev/prod environments

### 2. Content Security Policy

Configure CSP headers in `vercel.json` (optional):

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.firebase.com https://*.googleapis.com; img-src 'self' data: https:; font-src 'self' data:;"
}
```

## 📊 Monitoring & Analytics

### 1. Performance Monitoring

- **Build Analysis**: Run `npm run analyze` to check bundle size
- **Lighthouse**: Monitor Core Web Vitals in production
- **Vercel Analytics**: Enable in Vercel dashboard

### 2. Error Tracking

Configure Sentry (optional):

```typescript
// Add to src/main.tsx if VITE_SENTRY_DSN is set
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  });
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**: Check TypeScript errors with `npm run type-check`
2. **Environment Variables**: Verify all required variables are set
3. **Domain Not Working**: Check DNS propagation (can take up to 48 hours)
4. **Push Notifications**: Verify FCM VAPID key is correct
5. **Firebase Functions**: Check function logs in Firebase console

### Debug Commands

```bash
# Validate deployment configuration
npm run deploy:check

# Test build locally
npm run build && npm run preview

# Check TypeScript issues
npm run type-check

# Analyze bundle size
npm run analyze
```

## 📈 Post-Deployment Steps

1. ✅ Verify domain is accessible at https://plan.moonwave.kr
2. ✅ Test user authentication flow
3. ✅ Verify push notifications work
4. ✅ Test PWA installation on mobile devices  
5. ✅ Monitor error rates and performance
6. ✅ Set up monitoring alerts
7. ✅ Document any production-specific configurations

## 🔄 Continuous Deployment

The project is configured for automatic deployment:

- **Trigger**: Push to `main` branch
- **Environment**: Production deployment to plan.moonwave.kr
- **Validation**: Pre-deployment checks run automatically
- **Rollback**: Use Vercel dashboard for quick rollbacks

---

For support or questions about deployment, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Project GitHub Issues](https://github.com/your-repo/issues)