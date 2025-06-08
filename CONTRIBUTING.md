# Contributing to Reactr Middleware

Thank you for your interest in contributing to Reactr Middleware! We welcome contributions from the community and are grateful for your help in making this project better.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Git** for version control
- **TypeScript** knowledge (project is TypeScript-first)
- **React Router v7** familiarity

### Development Setup

1. **Fork and clone the repository**:
```bash
git clone https://github.com/your-username/reactr-middleware.git
cd reactr-middleware
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
# or  
pnpm install
```

3. **Run tests to verify setup**:
```bash
npm test
```

4. **Build the project**:
```bash
npm run build
```

5. **Run the example app** (optional):
```bash
cd examples/my-react-router-app
npm install
npm run dev
```

## 📋 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Test Structure

```typescript
// middleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { yourMiddleware } from '../src/middleware';

describe('yourMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle valid input', async () => {
    // Test implementation
  });

  it('should handle error cases', async () => {
    // Error test implementation
  });
});
```

### Test Requirements

- **All new features** must include tests
- **Bug fixes** must include regression tests
- **Coverage** should remain above 80%
- **Tests must pass** before submitting PR

## 📝 Code Style

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Strict mode** enabled - follow existing patterns
- **Export types** for public APIs
### Code Standards

#### Function Design
```typescript
// ✅ Good - clear, focused, typed
const authMiddleware = (redirectTo: string = '/login'): Middleware => {
  return async (context: MiddlewareContext): Promise<MiddlewareResponse> => {
    // Implementation
  };
};

// ❌ Bad - untyped, unclear purpose
const middleware = (options?: any) => {
  return async (ctx: any) => {
    // Implementation
  };
};
```

#### Error Handling
```typescript
// ✅ Good - explicit error handling
try {
  const result = await riskyOperation();
  return { continue: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { continue: false, redirect: '/error' };
}

// ❌ Bad - silent failures
const result = await riskyOperation().catch(() => null);
```

#### Documentation
```typescript
/**
 * Creates a rate limiting middleware with configurable limits
 * 
 * @param maxRequests - Maximum requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns Configured rate limiting middleware
 * 
 * @example
 * ```typescript
 * const rateLimiter = rateLimit(100, 60000); // 100 req/min
 * registerMiddleware('api', [rateLimiter]);
 * ```
 */
export const rateLimit = (maxRequests: number, windowMs: number): Middleware => {
  // Implementation
};
```

## 📖 Documentation

### Documentation Updates

When contributing, please update relevant documentation:

- **README.md** - For major feature additions
- **API documentation** - For new functions/types
- **Examples** - For new usage patterns
- **Type definitions** - Must be accurate and complete

### Documentation Site

The documentation site is in the `/site` directory using VitePress:

```bash
cd site
npm install
npm run dev  # Start dev server
npm run build  # Build for production
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Test with latest version** to ensure bug still exists
3. **Check documentation** for correct usage

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version:
- React Router version:
- Reactr Middleware version:
- Operating System:

## Additional Context
Any other relevant information
```

## ✨ Feature Requests

### Before Requesting

1. **Check existing issues** for similar requests
2. **Consider if it fits** the project's scope
3. **Think about implementation** complexity

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches were considered?

## Additional Context
Any other relevant information
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] **Tests pass** locally
- [ ] **Code is formatted** and linted
- [ ] **Documentation updated** if needed
- [ ] **CHANGELOG updated** for user-facing changes
- [ ] **Types exported** for new public APIs

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Discussion** if changes requested
4. **Approval** and merge

## 🏗️ Project Structure

```
reactr-middleware/
├── src/                    # Source code
│   ├── middleware-utils.ts # Main middleware utilities
│   ├── types.ts           # Type definitions
│   └── index.ts           # Public API exports
├── tests/                 # Test files
├── examples/              # Example applications
├── site/                  # Documentation site
├── dist/                  # Built output
```

## 🌟 Recognition

Contributors will be:

- **Listed** in the README contributors section
- **Mentioned** in release notes for significant contributions
- **Invited** to join the maintainer team for sustained contributions

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and community discussion
- **Documentation** - Check the docs site first

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

- **New middleware implementations** (caching, analytics, etc.)
- **Performance optimizations**
- **Documentation improvements**
- **Example applications**
- **Test coverage improvements**
- **TypeScript type improvements**

---

Thank you for contributing to Reactr Middleware! Your efforts help make React Router applications more maintainable and powerful. 🙏 