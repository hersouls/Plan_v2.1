#!/usr/bin/env node

/**
 * Firebase Functions Deployment Script
 * Validates and deploys Firebase Functions with proper error handling
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const functionsPath = path.join(projectRoot, 'functions')

console.log('🔥 Firebase Functions Deployment')
console.log('=================================')

// Check if functions directory exists
if (!fs.existsSync(functionsPath)) {
  console.log('❌ Functions directory not found')
  process.exit(1)
}

console.log('✅ Functions directory found')

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' })
  console.log('✅ Firebase CLI available')
} catch (error) {
  console.log('❌ Firebase CLI not installed')
  console.log('Run: npm install -g firebase-tools')
  process.exit(1)
}

// Check if user is logged in to Firebase
try {
  const user = execSync('firebase auth:list --project plan-e7bc6', { encoding: 'utf8' })
  console.log('✅ Firebase authentication verified')
} catch (error) {
  console.log('⚠️ Firebase authentication required')
  console.log('Run: firebase login')
}

// Validate Firebase project configuration
try {
  const firebaseConfig = fs.readFileSync(path.join(projectRoot, 'firebase.json'), 'utf8')
  const config = JSON.parse(firebaseConfig)
  
  if (config.functions) {
    console.log('✅ Firebase Functions configuration found')
  } else {
    console.log('❌ Firebase Functions not configured in firebase.json')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ Invalid firebase.json:', error.message)
  process.exit(1)
}

// Check functions source code
const functionsIndexPath = path.join(functionsPath, 'src', 'index.ts')
if (fs.existsSync(functionsIndexPath)) {
  console.log('✅ Functions source code found')
} else {
  console.log('❌ Functions source code missing')
  process.exit(1)
}

// Build functions
console.log('\n🔨 Building Functions...')
try {
  execSync('npm run build', { 
    cwd: functionsPath, 
    stdio: 'inherit' 
  })
  console.log('✅ Functions built successfully')
} catch (error) {
  console.log('❌ Functions build failed')
  process.exit(1)
}

// Validate environment for production
const isProduction = process.argv.includes('--production')

if (isProduction) {
  console.log('\n🚀 Production Deployment Validation...')
  
  // Check for production Firebase project
  try {
    const projectInfo = execSync('firebase projects:list', { encoding: 'utf8' })
    if (projectInfo.includes('plan-e7bc6')) {
      console.log('✅ Production Firebase project verified')
    } else {
      console.log('❌ Production Firebase project not found')
      process.exit(1)
    }
  } catch (error) {
    console.log('⚠️ Could not verify Firebase project')
  }
}

// Deploy functions
console.log('\n📦 Deploying Functions...')

const deployCommand = isProduction 
  ? 'firebase deploy --only functions --project plan-e7bc6'
  : 'firebase deploy --only functions'

try {
  execSync(deployCommand, { 
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: isProduction ? 'production' : 'development' }
  })
  
  console.log('\n🎉 Functions deployed successfully!')
  
  if (isProduction) {
    console.log('\n📋 Post-deployment Checklist:')
    console.log('1. ✅ Verify functions are responding correctly')
    console.log('2. ✅ Check function logs: firebase functions:log')
    console.log('3. ✅ Test push notifications')
    console.log('4. ✅ Verify scheduled functions')
    console.log('5. ✅ Monitor function performance')
    
    console.log('\n🔍 Useful Commands:')
    console.log('- Check logs: npm run firebase:logs')
    console.log('- Monitor functions: firebase functions:log --limit 50')
    console.log('- Test locally: npm run firebase:serve')
  }
  
} catch (error) {
  console.log('\n❌ Functions deployment failed')
  console.log('Check the error messages above for details')
  
  console.log('\n🔧 Troubleshooting:')
  console.log('1. Verify Firebase project permissions')
  console.log('2. Check functions source code for errors')
  console.log('3. Ensure all dependencies are installed')
  console.log('4. Check Firebase quotas and billing')
  
  process.exit(1)
}

console.log('\n✨ Deployment completed successfully!')