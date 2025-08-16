# Build Pipeline Documentation

## Overview

The Moonwave Plan project uses a comprehensive build pipeline with multiple quality gates to ensure code quality, type safety, and reliability.

## Available Scripts

### Development Scripts
```bash
npm run dev              # Start development server (port 3000)
npm run preview          # Preview production build (port 4173)
```

### Quality Assurance
```bash
npm run lint             # Full ESLint check (strict)
npm run lint:prod        # Production ESLint (allows 50 warnings)
npm run lint:fix         # Auto-fix ESLint issues
npm run type-check       # Full TypeScript type checking
npm run type-check:prod  # Production TypeScript checking (focused on src/)
npm run quality:check    # Combined lint:prod + type-check:prod
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:ci          # Run tests with coverage (CI mode)
npm run test:coverage    # Run tests with detailed coverage
npm run test:e2e         # Run Playwright E2E tests
```

### Build Scripts
```bash
npm run build            # Standard Vite build
npm run build:production # Full production build with quality checks
npm run build:check      # Comprehensive build pipeline validation
npm run ci:check         # CI-ready quality + test checks
npm run clean            # Clean build artifacts
```

### Deployment
```bash
npm run deploy:ready     # Pre-deployment validation
npm run deploy:prod      # Production deployment
npm run vercel:build     # Vercel-optimized build
```

## Build Pipeline Stages

### 1. Quality Checks (`npm run quality:check`)
- **ESLint (Production)**: Focused on `src/` directory, allows up to 50 warnings
- **TypeScript**: Uses `tsconfig.build.json` for production-focused type checking
- Excludes problematic files: `seed-data.ts`, test files, legacy utilities

### 2. Testing (`npm run test:ci`)
- Unit tests with Jest
- Integration tests for components and hooks
- Code coverage reporting
- Silent mode for CI environments

### 3. Build (`npm run build:production`)
- Runs quality checks first
- TypeScript compilation
- Vite production build with optimizations
- Bundle analysis (optional)

### 4. E2E Testing (`npm run test:e2e`)
- Playwright-based end-to-end tests
- User workflow validation
- Cross-browser compatibility checks

## Configuration Files

### ESLint Configurations
- `eslint.config.js` - Standard development linting (strict)
- `eslint.config.production.js` - Production build linting (lenient)

### TypeScript Configurations  
- `tsconfig.json` - Standard development configuration
- `tsconfig.build.json` - Production build configuration
- `tsconfig.app.json` - Application-specific settings

### Test Configuration
- `jest.config.js` - Jest unit test configuration
- `playwright.config.ts` - E2E test configuration
- `src/setupTests.ts` - Test environment setup

## Excluded Files (Production)

The production build pipeline excludes:
- `public/**/*.js` - Service workers and external scripts
- `scripts/**/*` - Build and utility scripts  
- `functions/**/*` - Firebase Cloud Functions
- `tests/**/*` - Test utilities and fixtures
- `src/utils/seed-data.ts` - Development seed data
- `src/lib/migration.ts` - Migration utilities
- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/**`)

## CI/CD Integration

### GitHub Actions Workflow
The project includes a comprehensive GitHub Actions workflow (`.github/workflows/ci.yml`) with:

1. **Test Suite**
   - Quality checks (lint + type check)
   - Unit tests with coverage
   - Coverage upload to Codecov

2. **Build Application**  
   - Production build
   - Artifact upload for deployment

3. **E2E Tests**
   - Playwright browser tests
   - Test report generation

4. **Security Scan**
   - npm audit for vulnerabilities
   - Custom security checks

5. **Deploy Preview** (PR only)
   - Vercel preview deployment

6. **Deploy Production** (main/master only)
   - Full validation pipeline
   - Vercel production deployment
   - Firebase deployment

### Required Secrets
```
VERCEL_TOKEN          # Vercel deployment token
VERCEL_ORG_ID         # Vercel organization ID  
VERCEL_PROJECT_ID     # Vercel project ID
FIREBASE_TOKEN        # Firebase CI token
```

## Quality Gates

### Development
- All ESLint errors must be fixed
- TypeScript compilation must pass
- Critical tests must pass

### Production
- ESLint: Max 50 warnings allowed
- TypeScript: Core `src/` files must compile
- Unit test coverage: Target 70%+
- E2E tests: Critical user flows must pass
- Security audit: No high/critical vulnerabilities

## Performance Optimization

### Build Optimizations
- Tree shaking for unused code
- Code splitting by route
- Asset optimization (images, fonts)
- Bundle analysis for size monitoring

### Runtime Optimizations
- React 18.3 with concurrent features
- Firebase 10.x with modern APIs
- Service worker for caching
- PWA optimizations

## Troubleshooting

### Common Build Issues

**TypeScript Errors**
```bash
# Check specific file types
npm run type-check:prod

# Skip problematic files temporarily
# Edit tsconfig.build.json exclude array
```

**ESLint Warnings**
```bash
# Fix auto-fixable issues
npm run lint:fix

# Check production rules only
npm run lint:prod
```

**Test Failures**
```bash
# Run specific test file
npm test -- TaskCard.test.tsx

# Update test snapshots
npm test -- --updateSnapshot
```

**Build Size Issues**
```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npm run analyze
```

### File Structure Issues
If moving files breaks the build:
1. Update import paths in affected files
2. Update test file locations
3. Update ESLint/TypeScript exclude patterns
4. Verify path mappings in `tsconfig.json`

## Monitoring

### Build Metrics
- Build time (target: <2 minutes)
- Bundle size (target: <1MB gzipped)
- Test coverage (target: 70%+)
- ESLint warnings (target: <50)

### Performance Metrics
- First Contentful Paint (FCP): <2s
- Largest Contentful Paint (LCP): <3s  
- Cumulative Layout Shift (CLS): <0.1
- Time to Interactive (TTI): <5s

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and fix ESLint warnings
- Monitor bundle size growth
- Update test snapshots when UI changes
- Review security audit reports

### Configuration Updates
- ESLint rules as team standards evolve
- TypeScript strict settings migration
- Test configuration for new features
- CI/CD pipeline optimization