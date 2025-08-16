#!/usr/bin/env node

/**
 * Pre-deployment Final Checklist
 * Comprehensive validation before production deployment
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🚀 Moonwave Plan - Pre-Deployment Checklist')
console.log('============================================')

const checks = []
let allPassed = true

function runCheck(name, command, critical = true) {
  console.log(`\n🔍 ${name}...`)
  try {
    execSync(command, { cwd: projectRoot, stdio: 'pipe' })
    console.log(`✅ ${name}: PASSED`)
    checks.push({ name, status: 'PASSED', critical })
    return true
  } catch (error) {
    console.log(`❌ ${name}: FAILED`)
    if (critical) {
      console.log(`   Error: ${error.message}`)
      allPassed = false
    }
    checks.push({ name, status: 'FAILED', critical })
    return false
  }
}

function fileExists(filePath, description) {
  const fullPath = path.join(projectRoot, filePath)
  const exists = fs.existsSync(fullPath)
  console.log(`\n📁 ${description}...`)
  if (exists) {
    console.log(`✅ ${description}: EXISTS`)
    checks.push({ name: description, status: 'EXISTS', critical: true })
    return true
  } else {
    console.log(`❌ ${description}: MISSING`)
    checks.push({ name: description, status: 'MISSING', critical: true })
    allPassed = false
    return false
  }
}

// Critical checks
console.log('\n🔥 CRITICAL VALIDATIONS')
console.log('=======================')

runCheck('TypeScript Type Check', 'npm run type-check')
runCheck('ESLint Code Quality', 'npm run lint')
runCheck('Security Configuration', 'npm run security:check')
runCheck('PWA Configuration', 'npm run pwa:check')
runCheck('Build Process', 'npm run build')

// File existence checks
console.log('\n📂 FILE INTEGRITY CHECKS')
console.log('========================')

fileExists('public/manifest.json', 'PWA Manifest')
fileExists('public/firebase-messaging-sw.js', 'Firebase Service Worker')
fileExists('vercel.json', 'Vercel Configuration')
fileExists('firebase.json', 'Firebase Configuration')
fileExists('firestore.rules', 'Firestore Security Rules')
fileExists('storage.rules', 'Storage Security Rules')
fileExists('.env.example', 'Environment Template')

// Optional checks
console.log('\n⚠️  OPTIONAL VALIDATIONS')
console.log('=======================')

runCheck('Unit Tests', 'npm test -- --passWithNoTests --watchAll=false', false)
runCheck('Bundle Analysis', 'npm run build:analyze', false)

// Environment validation
console.log('\n🌍 ENVIRONMENT VALIDATION')
console.log('=========================')

const requiredEnvVars = [
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

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: SET`)
    checks.push({ name: envVar, status: 'SET', critical: true })
  } else {
    console.log(`⚠️  ${envVar}: NOT SET (will need to be configured in deployment environment)`)
    checks.push({ name: envVar, status: 'NOT SET', critical: false })
  }
})

// Cleanup validation
console.log('\n🧹 CLEANUP VALIDATION')
console.log('=====================')

const unwantedPaths = [
  'public/Music',
  'src/components/MusicPlayer.tsx',
  'src/components/ConditionalMusicPlayer.tsx',
  'src/pages/Home.tsx',
  'src/pages/PlanDetail.tsx',
  'src/types/plan.ts'
]

unwantedPaths.forEach(unwantedPath => {
  const exists = fs.existsSync(path.join(projectRoot, unwantedPath))
  if (!exists) {
    console.log(`✅ ${unwantedPath}: REMOVED`)
    checks.push({ name: `Cleanup: ${unwantedPath}`, status: 'REMOVED', critical: true })
  } else {
    console.log(`❌ ${unwantedPath}: STILL EXISTS`)
    checks.push({ name: `Cleanup: ${unwantedPath}`, status: 'EXISTS', critical: true })
    allPassed = false
  }
})

// Build size validation
console.log('\n📊 BUILD SIZE VALIDATION')
console.log('========================')

try {
  const distPath = path.join(projectRoot, 'dist')
  if (fs.existsSync(distPath)) {
    const stats = fs.statSync(distPath)
    console.log(`✅ Build directory exists`)
    
    // Check for key build files
    const keyFiles = ['index.html', 'assets']
    keyFiles.forEach(file => {
      const filePath = path.join(distPath, file)
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: EXISTS`)
      } else {
        console.log(`❌ ${file}: MISSING`)
        allPassed = false
      }
    })
  } else {
    console.log(`❌ Build directory missing`)
    allPassed = false
  }
} catch (error) {
  console.log(`❌ Build validation failed: ${error.message}`)
  allPassed = false
}

// Final summary
console.log('\n📋 DEPLOYMENT READINESS SUMMARY')
console.log('===============================')

const criticalChecks = checks.filter(c => c.critical)
const passedCritical = criticalChecks.filter(c => c.status === 'PASSED' || c.status === 'EXISTS' || c.status === 'REMOVED' || c.status === 'SET')
const totalCritical = criticalChecks.length

console.log(`Critical Checks: ${passedCritical.length}/${totalCritical}`)
console.log(`Overall Status: ${allPassed ? '🟢 READY' : '🔴 NOT READY'}`)

if (allPassed) {
  console.log('\n🎉 ALL CRITICAL CHECKS PASSED!')
  console.log('✅ Project is ready for production deployment')
  console.log('\n🚀 Deployment Commands:')
  console.log('• Vercel: vercel --prod')
  console.log('• Firebase Functions: npm run functions:deploy:prod')
  console.log('• Manual: npm run deploy:prod')
  
  console.log('\n🔗 Post-Deployment:')
  console.log('• Verify: https://plan.moonwave.kr')
  console.log('• Monitor: Vercel dashboard')
  console.log('• Test: PWA installation on mobile')
  
} else {
  console.log('\n🚨 DEPLOYMENT BLOCKED!')
  console.log('❌ Critical issues must be resolved before deployment')
  
  const failedCritical = criticalChecks.filter(c => 
    c.status === 'FAILED' || c.status === 'MISSING' || c.status === 'EXISTS' && c.name.includes('Cleanup')
  )
  
  if (failedCritical.length > 0) {
    console.log('\n🔧 Issues to resolve:')
    failedCritical.forEach(check => {
      console.log(`   • ${check.name}: ${check.status}`)
    })
  }
}

// Generate deployment report
const reportPath = path.join(projectRoot, 'deployment-report.json')
const report = {
  timestamp: new Date().toISOString(),
  ready: allPassed,
  checks: checks,
  summary: {
    total: checks.length,
    passed: checks.filter(c => c.status === 'PASSED' || c.status === 'EXISTS' || c.status === 'REMOVED' || c.status === 'SET').length,
    critical: criticalChecks.length,
    criticalPassed: passedCritical.length
  }
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`\n📄 Report saved: deployment-report.json`)

process.exit(allPassed ? 0 : 1)