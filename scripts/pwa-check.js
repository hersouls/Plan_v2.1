#!/usr/bin/env node

/**
 * PWA Configuration Validator
 * Validates Progressive Web App configuration and requirements
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('📱 Moonwave Plan PWA Validator')
console.log('=============================')

const pwaIssues = []
const pwaPassed = []

// Validate manifest.json
function validateManifest() {
  console.log('\n📋 Validating Web App Manifest...')
  
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    pwaIssues.push('manifest.json file not found')
    return
  }
  
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)
    
    // Check required manifest fields
    const requiredFields = [
      'name',
      'short_name',
      'start_url',
      'display',
      'icons'
    ]
    
    requiredFields.forEach(field => {
      if (manifest[field]) {
        pwaPassed.push(`Manifest: ${field} field configured`)
      } else {
        pwaIssues.push(`Manifest: ${field} field missing`)
      }
    })
    
    // Validate icons
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const iconSizes = manifest.icons.map(icon => icon.sizes).filter(Boolean)
      const hasRequiredSizes = iconSizes.some(size => 
        size.includes('192x192') || size.includes('any')
      ) && iconSizes.some(size => 
        size.includes('512x512') || size.includes('any')
      )
      
      if (hasRequiredSizes) {
        pwaPassed.push('Manifest: Required icon sizes available')
      } else {
        pwaIssues.push('Manifest: Missing required icon sizes (192x192, 512x512)')
      }
      
      // Check if icon files exist
      manifest.icons.forEach((icon, index) => {
        const iconPath = path.join(projectRoot, 'public', icon.src)
        if (fs.existsSync(iconPath)) {
          pwaPassed.push(`Manifest: Icon ${index + 1} file exists (${icon.src})`)
        } else {
          pwaIssues.push(`Manifest: Icon ${index + 1} file missing (${icon.src})`)
        }
      })
    }
    
    // Check display mode
    const validDisplayModes = ['standalone', 'minimal-ui', 'fullscreen']
    if (manifest.display && validDisplayModes.includes(manifest.display)) {
      pwaPassed.push(`Manifest: Valid display mode (${manifest.display})`)
    } else {
      pwaIssues.push('Manifest: Invalid or missing display mode')
    }
    
    // Check theme color
    if (manifest.theme_color) {
      pwaPassed.push(`Manifest: Theme color configured (${manifest.theme_color})`)
    } else {
      pwaIssues.push('Manifest: Theme color missing')
    }
    
    // Check categories
    if (manifest.categories && Array.isArray(manifest.categories)) {
      pwaPassed.push(`Manifest: Categories defined (${manifest.categories.join(', ')})`)
    }
    
    // Check shortcuts
    if (manifest.shortcuts && Array.isArray(manifest.shortcuts)) {
      pwaPassed.push(`Manifest: ${manifest.shortcuts.length} shortcuts configured`)
    }
    
  } catch (error) {
    pwaIssues.push('Manifest: Invalid JSON format')
  }
}

// Validate Service Worker
function validateServiceWorker() {
  console.log('\n⚙️ Validating Service Worker...')
  
  // Check Firebase Messaging Service Worker
  const fcmSwPath = path.join(projectRoot, 'public', 'firebase-messaging-sw.js')
  if (fs.existsSync(fcmSwPath)) {
    pwaPassed.push('Service Worker: Firebase messaging SW exists')
    
    const swContent = fs.readFileSync(fcmSwPath, 'utf8')
    
    // Check for key service worker features
    if (swContent.includes('onBackgroundMessage')) {
      pwaPassed.push('Service Worker: Background message handling implemented')
    }
    
    if (swContent.includes('notificationclick')) {
      pwaPassed.push('Service Worker: Notification click handling implemented')
    }
    
    if (swContent.includes('showNotification')) {
      pwaPassed.push('Service Worker: Notification display implemented')
    }
  } else {
    pwaIssues.push('Service Worker: Firebase messaging SW missing')
  }
  
  // Check for additional service worker
  const swPath = path.join(projectRoot, 'public', 'sw.js')
  if (fs.existsSync(swPath)) {
    pwaPassed.push('Service Worker: Additional SW file exists')
  }
}

// Validate HTML PWA meta tags
function validateHTML() {
  console.log('\n🌐 Validating HTML PWA Configuration...')
  
  const htmlPath = path.join(projectRoot, 'index.html')
  if (!fs.existsSync(htmlPath)) {
    pwaIssues.push('index.html file not found')
    return
  }
  
  const htmlContent = fs.readFileSync(htmlPath, 'utf8')
  
  // Check for required PWA meta tags
  const requiredMetaTags = [
    { tag: 'theme-color', name: 'Theme color meta tag' },
    { tag: 'apple-mobile-web-app-capable', name: 'Apple mobile web app capability' },
    { tag: 'mobile-web-app-capable', name: 'Mobile web app capability' },
    { tag: 'apple-mobile-web-app-title', name: 'Apple mobile app title' }
  ]
  
  requiredMetaTags.forEach(meta => {
    if (htmlContent.includes(`name="${meta.tag}"`) || htmlContent.includes(`property="${meta.tag}"`)) {
      pwaPassed.push(`HTML: ${meta.name} configured`)
    } else {
      pwaIssues.push(`HTML: ${meta.name} missing`)
    }
  })
  
  // Check for manifest link
  if (htmlContent.includes('rel="manifest"')) {
    pwaPassed.push('HTML: Manifest link exists')
  } else {
    pwaIssues.push('HTML: Manifest link missing')
  }
  
  // Check viewport meta tag
  if (htmlContent.includes('name="viewport"') && htmlContent.includes('width=device-width')) {
    pwaPassed.push('HTML: Responsive viewport configured')
  } else {
    pwaIssues.push('HTML: Responsive viewport meta tag missing')
  }
  
  // Check for apple touch icons
  if (htmlContent.includes('rel="apple-touch-icon"')) {
    pwaPassed.push('HTML: Apple touch icons configured')
  } else {
    pwaIssues.push('HTML: Apple touch icons missing')
  }
}

// Validate HTTPS/SSL requirement
function validateHTTPS() {
  console.log('\n🔒 Validating HTTPS Configuration...')
  
  // Check Vercel configuration for HTTPS
  const vercelConfigPath = path.join(projectRoot, 'vercel.json')
  if (fs.existsSync(vercelConfigPath)) {
    pwaPassed.push('Deployment: Vercel configuration exists (HTTPS enabled by default)')
  }
  
  // Check environment configuration
  const envExamplePath = path.join(projectRoot, '.env.example')
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8')
    if (envContent.includes('https://')) {
      pwaPassed.push('Environment: HTTPS URLs configured')
    } else {
      pwaIssues.push('Environment: HTTPS URLs not configured')
    }
  }
}

// Check PWA build configuration
function validateBuildConfig() {
  console.log('\n🔧 Validating Build Configuration...')
  
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts')
  if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8')
    
    // Check if PWA plugin is configured (optional)
    if (viteConfig.includes('VitePWA')) {
      pwaPassed.push('Build: Vite PWA plugin configured')
    } else {
      console.log('ℹ️  Note: Consider adding Vite PWA plugin for advanced PWA features')
    }
  }
  
  const packagePath = path.join(projectRoot, 'package.json')
  if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8')
    const packageJson = JSON.parse(packageContent)
    
    if (packageJson.scripts && packageJson.scripts.build) {
      pwaPassed.push('Build: Build script configured')
    }
  }
}

// Run all PWA validations
validateManifest()
validateServiceWorker()
validateHTML()
validateHTTPS()
validateBuildConfig()

// Display results
console.log('\n📊 PWA Validation Results')
console.log('=========================')

if (pwaPassed.length > 0) {
  console.log('\n✅ PWA Checks Passed:')
  pwaPassed.forEach(item => console.log(`  ✓ ${item}`))
}

if (pwaIssues.length > 0) {
  console.log('\n❌ PWA Issues Found:')
  pwaIssues.forEach(item => console.log(`  ✗ ${item}`))
  
  console.log('\n🔧 PWA Optimization Recommendations:')
  console.log('1. Fix all PWA issues listed above')
  console.log('2. Test PWA installation on mobile devices')
  console.log('3. Validate with Lighthouse PWA audit')
  console.log('4. Test offline functionality')
  console.log('5. Verify push notifications work')
  console.log('6. Test app shortcuts and share target')
  
} else {
  console.log('\n🎉 All PWA checks passed!')
}

console.log('\n🛠️ PWA Testing Tools')
console.log('====================')
console.log('• Lighthouse: Run PWA audit in Chrome DevTools')
console.log('• PWA Builder: https://www.pwabuilder.com/')
console.log('• Web App Manifest Generator: https://app-manifest.firebaseapp.com/')
console.log('• Chrome DevTools Application tab: Test PWA features')

console.log('\n📋 PWA Summary')
console.log('===============')
console.log(`✅ Passed: ${pwaPassed.length}`)
console.log(`❌ Issues: ${pwaIssues.length}`)

// PWA score calculation
const totalChecks = pwaPassed.length + pwaIssues.length
const pwaScore = totalChecks > 0 ? Math.round((pwaPassed.length / totalChecks) * 100) : 0

console.log(`📊 PWA Score: ${pwaScore}%`)

if (pwaScore >= 90) {
  console.log('\n🏆 Excellent PWA configuration!')
} else if (pwaScore >= 70) {
  console.log('\n👍 Good PWA configuration with room for improvement')
} else {
  console.log('\n⚠️ PWA configuration needs significant improvement')
}

if (pwaIssues.length === 0) {
  console.log('\n✨ PWA is ready for production!')
  process.exit(0)
} else {
  console.log('\n🔄 Address PWA issues before production deployment')
  process.exit(1)
}