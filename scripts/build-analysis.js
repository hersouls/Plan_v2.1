#!/usr/bin/env node

/**
 * Build Analysis Script
 * Analyzes bundle size and provides optimization recommendations
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

console.log('📊 Moonwave Plan Build Analysis')
console.log('===============================')

// Check if build exists
if (!fs.existsSync(distPath)) {
  console.log('❌ Build not found. Running build...')
  try {
    execSync('npm run build', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    })
  } catch (error) {
    console.log('❌ Build failed')
    process.exit(1)
  }
}

console.log('✅ Build directory found')

// Get build statistics
function getBuildStats() {
  const stats = {
    totalSize: 0,
    files: [],
    jsFiles: [],
    cssFiles: [],
    assetFiles: []
  }

  function analyzePath(dirPath, relativePath = '') {
    const files = fs.readdirSync(dirPath)
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const relativeFilePath = path.join(relativePath, file)
      const fileStat = fs.statSync(filePath)
      
      if (fileStat.isDirectory()) {
        analyzePath(filePath, relativeFilePath)
      } else {
        const fileSize = fileStat.size
        const fileInfo = {
          name: file,
          path: relativeFilePath,
          size: fileSize,
          sizeFormatted: formatBytes(fileSize)
        }
        
        stats.totalSize += fileSize
        stats.files.push(fileInfo)
        
        if (file.endsWith('.js')) {
          stats.jsFiles.push(fileInfo)
        } else if (file.endsWith('.css')) {
          stats.cssFiles.push(fileInfo)
        } else {
          stats.assetFiles.push(fileInfo)
        }
      }
    })
  }

  analyzePath(distPath)
  return stats
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Analyze build
const stats = getBuildStats()

console.log('\n📈 Build Statistics')
console.log('===================')
console.log(`Total Size: ${formatBytes(stats.totalSize)}`)
console.log(`Total Files: ${stats.files.length}`)
console.log(`JavaScript Files: ${stats.jsFiles.length}`)
console.log(`CSS Files: ${stats.cssFiles.length}`)
console.log(`Asset Files: ${stats.assetFiles.length}`)

// Show largest files
console.log('\n🎯 Largest Files')
console.log('================')
const largestFiles = stats.files
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)

largestFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.name} - ${file.sizeFormatted}`)
})

// JavaScript analysis
console.log('\n📦 JavaScript Chunks')
console.log('====================')
stats.jsFiles
  .sort((a, b) => b.size - a.size)
  .forEach(file => {
    console.log(`${file.name} - ${file.sizeFormatted}`)
  })

// CSS analysis  
if (stats.cssFiles.length > 0) {
  console.log('\n🎨 CSS Files')
  console.log('============')
  stats.cssFiles
    .sort((a, b) => b.size - a.size)
    .forEach(file => {
      console.log(`${file.name} - ${file.sizeFormatted}`)
    })
}

// Performance recommendations
console.log('\n⚡ Performance Recommendations')
console.log('==============================')

const totalJSSize = stats.jsFiles.reduce((sum, file) => sum + file.size, 0)
const totalCSSSize = stats.cssFiles.reduce((sum, file) => sum + file.size, 0)

// JS size analysis
if (totalJSSize > 1024 * 1024) { // > 1MB
  console.log('⚠️  JavaScript bundle is large (' + formatBytes(totalJSSize) + ')')
  console.log('   Consider: Code splitting, dynamic imports, tree shaking')
} else if (totalJSSize > 500 * 1024) { // > 500KB
  console.log('⚠️  JavaScript bundle is moderate (' + formatBytes(totalJSSize) + ')')
  console.log('   Consider: Review large dependencies, optimize imports')
} else {
  console.log('✅ JavaScript bundle size is good (' + formatBytes(totalJSSize) + ')')
}

// CSS size analysis
if (totalCSSSize > 200 * 1024) { // > 200KB
  console.log('⚠️  CSS bundle is large (' + formatBytes(totalCSSSize) + ')')
  console.log('   Consider: CSS purging, critical CSS extraction')
} else {
  console.log('✅ CSS bundle size is good (' + formatBytes(totalCSSSize) + ')')
}

// Check for source maps
const sourceMapFiles = stats.files.filter(file => file.name.endsWith('.map'))
if (sourceMapFiles.length > 0) {
  const sourceMapSize = sourceMapFiles.reduce((sum, file) => sum + file.size, 0)
  console.log(`⚠️  Source maps included (${formatBytes(sourceMapSize)})`)
  console.log('   Consider: Disable for production builds')
}

// Check for large individual files
const largeFiles = stats.files.filter(file => file.size > 500 * 1024) // > 500KB
if (largeFiles.length > 0) {
  console.log('⚠️  Large individual files detected:')
  largeFiles.forEach(file => {
    console.log(`   ${file.name} - ${file.sizeFormatted}`)
  })
}

console.log('\n🔍 Optimization Tools')
console.log('=====================')
console.log('• Run bundle analyzer: npm run analyze')
console.log('• Check dependencies: npm ls --depth=0')
console.log('• Audit packages: npm audit')
console.log('• Lighthouse audit: Run in browser dev tools')

// Summary
console.log('\n📋 Summary')
console.log('==========')

if (stats.totalSize < 2 * 1024 * 1024) { // < 2MB
  console.log('🎉 Build size is excellent!')
} else if (stats.totalSize < 5 * 1024 * 1024) { // < 5MB  
  console.log('✅ Build size is good')
} else {
  console.log('⚠️  Build size needs optimization')
}

console.log(`Total bundle size: ${formatBytes(stats.totalSize)}`)
console.log(`Largest JS file: ${stats.jsFiles.length > 0 ? formatBytes(Math.max(...stats.jsFiles.map(f => f.size))) : 'N/A'}`)
console.log(`Number of chunks: ${stats.jsFiles.length}`)

console.log('\n✨ Analysis completed!')

// Exit with appropriate code
if (stats.totalSize > 10 * 1024 * 1024) { // > 10MB
  console.log('\n❌ Build size is too large for production')
  process.exit(1)
} else {
  process.exit(0)
}