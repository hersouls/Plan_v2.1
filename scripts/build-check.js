#!/usr/bin/env node

/**
 * Build Check Script
 * Comprehensive build pipeline with quality checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

class BuildChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  async runCommand(command, description) {
    console.log(`🔄 ${description}...`);
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('warning') && !stderr.includes('info')) {
        throw new Error(stderr);
      }
      
      this.passed.push({ description, output: stdout });
      console.log(`✅ ${description} passed`);
      return { success: true, output: stdout };
    } catch (error) {
      this.errors.push({ description, error: error.message });
      console.log(`❌ ${description} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runLintCheck() {
    // Focus on src directory only for critical linting
    const lintCommand = 'npx eslint src --ext .ts,.tsx --max-warnings 50 --format=compact';
    return await this.runCommand(lintCommand, 'ESLint (Core Source Files)');
  }

  async runTypeCheck() {
    // Type check with focus on src files
    const typeCheckCommand = 'npx tsc --noEmit --skipLibCheck';
    return await this.runCommand(typeCheckCommand, 'TypeScript Type Check');
  }

  async runTests() {
    const testCommand = 'npm test -- --passWithNoTests --silent';
    return await this.runCommand(testCommand, 'Unit Tests');
  }

  async runBuild() {
    // Clean and build
    const buildCommand = 'npm run build';
    return await this.runCommand(buildCommand, 'Production Build');
  }

  async runAll() {
    console.log('🚀 Starting Build Pipeline Checks\n');

    const checks = [
      { name: 'lint', fn: () => this.runLintCheck() },
      { name: 'typecheck', fn: () => this.runTypeCheck() },
      { name: 'test', fn: () => this.runTests() },
      { name: 'build', fn: () => this.runBuild() }
    ];

    for (const check of checks) {
      await check.fn();
      console.log(''); // Add spacing
    }

    this.printSummary();
    return this.errors.length === 0;
  }

  printSummary() {
    console.log('\n📊 BUILD PIPELINE SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`\n✅ Passed (${this.passed.length}):`);
    this.passed.forEach(item => {
      console.log(`   • ${item.description}`);
    });

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(item => {
        console.log(`   • ${item.description}: ${item.warning}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Failed (${this.errors.length}):`);
      this.errors.forEach(item => {
        console.log(`   • ${item.description}: ${item.error.substring(0, 200)}...`);
      });
    }

    if (this.errors.length === 0) {
      console.log('\n🎉 All checks passed! Ready for deployment.');
    } else {
      console.log('\n💥 Build pipeline failed. Please fix the errors above.');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new BuildChecker();
  checker.runAll().catch(error => {
    console.error('Build pipeline failed:', error);
    process.exit(1);
  });
}

export { BuildChecker };