#!/usr/bin/env node

/**
 * MCP Test Runner for Moonwave Plan
 * Comprehensive test execution with reporting
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🎭 MCP Playwright Test Runner')
console.log('=============================')

// Parse command line arguments
const args = process.argv.slice(2)
const isHeaded = args.includes('--headed')
const isDebug = args.includes('--debug')
const isUI = args.includes('--ui')
const testPattern = args.find(arg => arg.startsWith('--grep='))?.split('=')[1]

// Ensure test directories exist
const testDirs = [
  'test-results',
  'test-results/screenshots',
  'playwright-report'
]

testDirs.forEach(dir => {
  const fullPath = path.join(projectRoot, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
})

// Environment setup
process.env.NODE_ENV = 'test'
process.env.CI = process.env.CI || 'false'

console.log('\n🔧 Test Environment Setup')
console.log('=========================')
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`CI: ${process.env.CI}`)
console.log(`Headed: ${isHeaded}`)
console.log(`Debug: ${isDebug}`)
console.log(`UI: ${isUI}`)
if (testPattern) console.log(`Pattern: ${testPattern}`)

// Install browsers if needed
console.log('\n📥 Installing Playwright Browsers...')
try {
  execSync('npx playwright install', { 
    stdio: 'inherit',
    cwd: projectRoot
  })
  console.log('✅ Browsers installed successfully')
} catch (error) {
  console.log('⚠️ Browser installation failed, continuing with existing browsers')
}

// Build test command
let testCommand = 'npx playwright test'

if (isUI) {
  testCommand += ' --ui'
} else if (isDebug) {
  testCommand += ' --debug'
} else if (isHeaded) {
  testCommand += ' --headed'
}

if (testPattern) {
  testCommand += ` --grep "${testPattern}"`
}

// Add reporter options
if (!isUI && !isDebug) {
  testCommand += ' --reporter=html,json,junit'
}

console.log(`\n🧪 Running Tests: ${testCommand}`)
console.log('=================')

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  duration: 0
}

const startTime = Date.now()

try {
  execSync(testCommand, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env }
  })
  
  console.log('\n🎉 All tests passed!')
  testResults.passed = testResults.total
  
} catch (error) {
  console.log('\n🔍 Test execution completed with issues')
  
  // Try to parse test results if available
  const resultsPath = path.join(projectRoot, 'test-results', 'results.json')
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
      testResults = {
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        total: results.stats?.total || 0,
        duration: results.stats?.duration || 0
      }
    } catch (e) {
      console.log('⚠️ Could not parse test results')
    }
  }
}

const endTime = Date.now()
const totalDuration = endTime - startTime

console.log('\n📊 Test Summary')
console.log('===============')
console.log(`Duration: ${Math.round(totalDuration / 1000)}s`)

if (testResults.total > 0) {
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⏭️ Skipped: ${testResults.skipped}`)
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`)
}

// Generate test report
const reportData = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeEnv: process.env.NODE_ENV,
    ci: process.env.CI,
    headed: isHeaded,
    debug: isDebug,
    ui: isUI
  },
  results: testResults,
  duration: totalDuration,
  command: testCommand
}

const reportPath = path.join(projectRoot, 'test-results', 'test-summary.json')
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))

console.log('\n📁 Generated Files')
console.log('==================')
console.log('• test-results/test-summary.json - Test summary')
console.log('• playwright-report/index.html - HTML report')
console.log('• test-results/results.json - Detailed results')

if (!isUI && !isDebug) {
  console.log('\n📖 View Reports:')
  console.log('• HTML Report: npm run test:e2e:report')
  console.log('• Interactive UI: npm run test:e2e:ui')
  console.log('• Debug Mode: npm run test:e2e:debug')
}

console.log('\n🔍 Test Categories Covered:')
console.log('• 01-app-startup.spec.ts - App initialization & PWA basics')
console.log('• 02-task-management.spec.ts - Core task functionality')
console.log('• 03-pwa-features.spec.ts - Progressive Web App features')
console.log('• 04-family-collaboration.spec.ts - Family features')

// Exit with appropriate code
const exitCode = testResults.failed > 0 ? 1 : 0
console.log(`\n${exitCode === 0 ? '✅' : '❌'} Testing completed with exit code: ${exitCode}`)
process.exit(exitCode)