#!/usr/bin/env node

/**
 * Deployment script for Moonwave Plan
 * Validates environment variables and deployment configuration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FCM_VAPID_KEY',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_APP_URL'
]

const OPTIONAL_ENV_VARS = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_GOOGLE_ANALYTICS_ID',
  'VITE_SENTRY_DSN'
]

console.log('🚀 Moonwave Plan Deployment Validator')
console.log('=====================================')

// Check if running in production mode
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production')

if (isProduction) {
  console.log('✅ Running in PRODUCTION mode')
} else {
  console.log('🧪 Running in DEVELOPMENT mode')
}

// Validate required environment variables
console.log('\n📋 Validating Environment Variables...')

const missingVars = []
const foundVars = []

REQUIRED_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    foundVars.push(varName)
    console.log(`✅ ${varName}: Found`)
  } else {
    missingVars.push(varName)
    console.log(`❌ ${varName}: Missing`)
  }
})

OPTIONAL_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    foundVars.push(varName)
    console.log(`✅ ${varName}: Found (optional)`)
  } else {
    console.log(`⚠️ ${varName}: Missing (optional)`)
  }
})

// Check if firebase-messaging-sw.js exists
console.log('\n📱 Validating PWA Configuration...')

const swPath = path.join(projectRoot, 'public', 'firebase-messaging-sw.js')
if (fs.existsSync(swPath)) {
  console.log('✅ firebase-messaging-sw.js: Found')
} else {
  console.log('❌ firebase-messaging-sw.js: Missing')
  missingVars.push('firebase-messaging-sw.js')
}

// Check if manifest.json exists (if PWA is enabled)
if (process.env.VITE_ENABLE_PWA === 'true') {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    console.log('✅ manifest.json: Found')
  } else {
    console.log('❌ manifest.json: Missing (PWA enabled)')
    missingVars.push('manifest.json')
  }
}

// Validate Vercel configuration
console.log('\n⚡ Validating Vercel Configuration...')

const vercelConfigPath = path.join(projectRoot, 'vercel.json')
if (fs.existsSync(vercelConfigPath)) {
  console.log('✅ vercel.json: Found')
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'))
    
    // Check if environment variables are configured in Vercel config
    if (vercelConfig.env) {
      console.log('✅ Environment variables configured in vercel.json')
    } else {
      console.log('⚠️ No environment variables found in vercel.json')
    }
    
    // Check if service worker headers are configured
    const headers = vercelConfig.headers || []
    const swHeaders = headers.find(header => header.source === '/firebase-messaging-sw.js')
    
    if (swHeaders) {
      console.log('✅ Service worker headers configured')
    } else {
      console.log('⚠️ Service worker headers not found')
    }
    
  } catch (error) {
    console.log('❌ Invalid vercel.json format:', error.message)
    missingVars.push('valid vercel.json')
  }
} else {
  console.log('❌ vercel.json: Missing')
  missingVars.push('vercel.json')
}

// Check Firebase Functions configuration (if exists)
const functionsPath = path.join(projectRoot, 'functions')
if (fs.existsSync(functionsPath)) {
  console.log('\n🔥 Firebase Functions detected')
  
  const functionsSrcPath = path.join(functionsPath, 'src', 'index.ts')
  if (fs.existsSync(functionsSrcPath)) {
    console.log('✅ Firebase Functions source: Found')
  } else {
    console.log('❌ Firebase Functions source: Missing')
  }
  
  const functionsPackagePath = path.join(functionsPath, 'package.json')
  if (fs.existsSync(functionsPackagePath)) {
    console.log('✅ Firebase Functions package.json: Found')
  } else {
    console.log('❌ Firebase Functions package.json: Missing')
  }
}

// Final validation result
console.log('\n📊 Deployment Validation Summary')
console.log('=================================')

if (missingVars.length === 0) {
  console.log('🎉 All validations passed! Ready for deployment.')
  console.log(`✅ Found ${foundVars.length} environment variables`)
  
  if (isProduction) {
    console.log('\n🚀 Production Deployment Checklist:')
    console.log('1. Verify all Firebase project settings')
    console.log('2. Test push notifications functionality')
    console.log('3. Verify domain configuration (plan.moonwave.kr)')
    console.log('4. Check Firebase security rules')
    console.log('5. Monitor deployment logs for errors')
  }
  
  process.exit(0)
} else {
  console.log('❌ Deployment validation failed!')
  console.log(`Missing: ${missingVars.join(', ')}`)
  
  console.log('\n🔧 To fix these issues:')
  console.log('1. Check your .env file contains all required variables')
  console.log('2. Verify Vercel environment variables are set')
  console.log('3. Ensure all PWA files are present in /public')
  console.log('4. Run "npm run build" to test the build locally')
  
  process.exit(1)
}