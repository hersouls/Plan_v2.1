#!/usr/bin/env node

/**
 * Security Configuration Validator
 * Validates Firebase security rules and deployment security settings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🔒 Moonwave Plan Security Check')
console.log('===============================')

let securityIssues = []
let securityPassed = []

// Check Firestore Security Rules
function validateFirestoreRules() {
  console.log('\n🔥 Validating Firestore Security Rules...')
  
  const rulesPath = path.join(projectRoot, 'firestore.rules')
  if (!fs.existsSync(rulesPath)) {
    securityIssues.push('Firestore security rules file not found')
    return
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8')
  
  // Check for critical security patterns
  const securityChecks = [
    {
      pattern: /isAuthenticated\(\)/,
      message: 'Authentication helper function',
      required: true
    },
    {
      pattern: /isOwner\(/,
      message: 'Ownership validation helper',
      required: true
    },
    {
      pattern: /isGroupMember\(/,
      message: 'Group membership validation',
      required: true
    },
    {
      pattern: /allow read, write: if false/,
      message: 'Default deny rule',
      required: true
    },
    {
      pattern: /request\.auth != null/,
      message: 'Authentication checks',
      required: true
    },
    {
      pattern: /allow read, write: if true/,
      message: 'Dangerous open permissions',
      required: false,
      warning: true
    }
  ]
  
  securityChecks.forEach(check => {
    const found = check.pattern.test(rulesContent)
    
    if (check.required && !found) {
      securityIssues.push(`Firestore: Missing ${check.message}`)
    } else if (check.required && found) {
      securityPassed.push(`Firestore: ${check.message} implemented`)
    }
    
    if (check.warning && found) {
      securityIssues.push(`Firestore: Warning - ${check.message} detected`)
    }
  })
  
  // Check for specific collection security
  const collections = ['users', 'groups', 'tasks', 'notifications', 'activities']
  collections.forEach(collection => {
    if (rulesContent.includes(`match /${collection}/`)) {
      securityPassed.push(`Firestore: ${collection} collection security defined`)
    } else {
      securityIssues.push(`Firestore: ${collection} collection security missing`)
    }
  })
}

// Check Storage Security Rules
function validateStorageRules() {
  console.log('\n📦 Validating Storage Security Rules...')
  
  const rulesPath = path.join(projectRoot, 'storage.rules')
  if (!fs.existsSync(rulesPath)) {
    securityIssues.push('Storage security rules file not found')
    return
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8')
  
  const storageChecks = [
    {
      pattern: /isAuthenticated\(\)/,
      message: 'Authentication helper function',
      required: true
    },
    {
      pattern: /isValidFileSize\(/,
      message: 'File size validation',
      required: true
    },
    {
      pattern: /contentType\.matches/,
      message: 'File type validation',
      required: true
    },
    {
      pattern: /allow read, write: if false/,
      message: 'Default deny rule',
      required: true
    },
    {
      pattern: /match \/\{allPaths=\*\*\}/,
      message: 'Wildcard permissions',
      required: false,
      check: (content) => {
        const wildcardMatches = content.match(/match \/\{allPaths=\*\*\}[\s\S]*?allow read, write: if [^;]+;/g)
        return wildcardMatches ? wildcardMatches.some(match => match.includes('if true')) : false
      },
      warning: true
    }
  ]
  
  storageChecks.forEach(check => {
    let found
    if (check.check) {
      found = check.check(rulesContent)
    } else {
      found = check.pattern.test(rulesContent)
    }
    
    if (check.required && !found) {
      securityIssues.push(`Storage: Missing ${check.message}`)
    } else if (check.required && found) {
      securityPassed.push(`Storage: ${check.message} implemented`)
    }
    
    if (check.warning && found) {
      securityIssues.push(`Storage: Warning - ${check.message} detected`)
    }
  })
}

// Check Environment Variable Security
function validateEnvironmentSecurity() {
  console.log('\n🌍 Validating Environment Security...')
  
  // Check .env file is not committed
  const envPath = path.join(projectRoot, '.env')
  if (fs.existsSync(envPath)) {
    securityIssues.push('Production .env file exists in repository')
  } else {
    securityPassed.push('No .env file in repository (good)')
  }
  
  // Check .env.example exists
  const envExamplePath = path.join(projectRoot, '.env.example')
  if (fs.existsSync(envExamplePath)) {
    securityPassed.push('.env.example template file exists')
    
    const envContent = fs.readFileSync(envExamplePath, 'utf8')
    
    // Check for placeholder values
    if (envContent.includes('your-') || envContent.includes('YOUR_')) {
      securityPassed.push('Environment variables use placeholder values')
    } else {
      securityIssues.push('Environment variables may contain actual values')
    }
  } else {
    securityIssues.push('.env.example template file missing')
  }
  
  // Check gitignore contains .env
  const gitignorePath = path.join(projectRoot, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
    if (gitignoreContent.includes('.env')) {
      securityPassed.push('.env files ignored in git')
    } else {
      securityIssues.push('.env files not ignored in git')
    }
  }
}

// Check Vercel Configuration Security
function validateVercelSecurity() {
  console.log('\n⚡ Validating Vercel Configuration...')
  
  const vercelConfigPath = path.join(projectRoot, 'vercel.json')
  if (!fs.existsSync(vercelConfigPath)) {
    securityIssues.push('vercel.json configuration file missing')
    return
  }
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'))
    
    // Check security headers
    const headers = vercelConfig.headers || []
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options', 
      'X-XSS-Protection',
      'Referrer-Policy'
    ]
    
    let hasSecurityHeaders = false
    headers.forEach(headerConfig => {
      if (headerConfig.headers) {
        const configuredHeaders = headerConfig.headers.map(h => h.key)
        securityHeaders.forEach(requiredHeader => {
          if (configuredHeaders.includes(requiredHeader)) {
            hasSecurityHeaders = true
            securityPassed.push(`Vercel: ${requiredHeader} header configured`)
          }
        })
      }
    })
    
    if (!hasSecurityHeaders) {
      securityIssues.push('Vercel: Security headers not configured')
    }
    
    // Check if service worker headers exist
    const swHeaders = headers.find(h => h.source === '/firebase-messaging-sw.js')
    if (swHeaders) {
      securityPassed.push('Vercel: Service Worker headers configured')
    } else {
      securityIssues.push('Vercel: Service Worker headers missing')
    }
    
  } catch (error) {
    securityIssues.push('Vercel: Invalid JSON configuration')
  }
}

// Check Firebase Functions Security
function validateFunctionsSecurity() {
  console.log('\n🔧 Validating Firebase Functions Security...')
  
  const functionsIndexPath = path.join(projectRoot, 'functions', 'src', 'index.ts')
  if (!fs.existsSync(functionsIndexPath)) {
    securityIssues.push('Firebase Functions source code not found')
    return
  }
  
  const functionsContent = fs.readFileSync(functionsIndexPath, 'utf8')
  
  // Check for security patterns in functions
  if (functionsContent.includes('admin.firestore()')) {
    securityPassed.push('Functions: Firebase Admin SDK used')
  }
  
  if (functionsContent.includes('request.auth')) {
    securityPassed.push('Functions: Authentication context used')
  }
  
  if (functionsContent.includes('console.log') && functionsContent.includes('error')) {
    securityPassed.push('Functions: Error logging implemented')
  }
  
  // Check for potential security issues
  if (functionsContent.includes('cors: true')) {
    securityIssues.push('Functions: CORS enabled globally (potential security risk)')
  }
  
  if (functionsContent.includes('auth: false')) {
    securityIssues.push('Functions: Authentication bypass detected')
  }
}

// Run all security checks
validateFirestoreRules()
validateStorageRules()
validateEnvironmentSecurity()
validateVercelSecurity()
validateFunctionsSecurity()

// Display results
console.log('\n📊 Security Check Results')
console.log('==========================')

if (securityPassed.length > 0) {
  console.log('\n✅ Security Checks Passed:')
  securityPassed.forEach(item => console.log(`  ✓ ${item}`))
}

if (securityIssues.length > 0) {
  console.log('\n❌ Security Issues Found:')
  securityIssues.forEach(item => console.log(`  ✗ ${item}`))
  
  console.log('\n🔧 Recommended Actions:')
  console.log('1. Review and fix all security issues listed above')
  console.log('2. Test security rules with Firebase emulator')
  console.log('3. Validate authentication flows in production')
  console.log('4. Monitor for unusual access patterns')
  console.log('5. Regular security audits and rule updates')
  
} else {
  console.log('\n🎉 All security checks passed!')
}

console.log('\n📋 Security Summary')
console.log('===================')
console.log(`✅ Passed: ${securityPassed.length}`)
console.log(`❌ Issues: ${securityIssues.length}`)

if (securityIssues.length === 0) {
  console.log('\n🛡️ Security configuration is production-ready!')
  process.exit(0)
} else {
  console.log('\n⚠️ Security issues need to be addressed before production deployment!')
  process.exit(1)
}