---
title: Registry
---
# Registry

The registry system allows you to organize and manage middleware groups centrally, making it easy to reuse common middleware patterns across your application.

## Basic Usage

### Registering Middleware
```typescript
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';

// Register a group of middleware
registerMiddleware('protected', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(50, 60000),
  commonMiddlewares.logger({ includeBody: true })
]);
```

### Using Registered Middleware
```typescript
import { createLoaderFromRegistry } from 'reactr-middleware';

// Use the registered middleware group
export const loader = createLoaderFromRegistry('protected');
```

## Registry Patterns

### Environment-Specific Groups
```typescript
// middleware.config.ts
if (process.env.NODE_ENV === 'development') {
  registerMiddleware('api', [
    commonMiddlewares.cors({ origins: ['*'] }),
    commonMiddlewares.logger({ includeBody: true }),
    debugMiddleware // Only in dev
  ]);
} else {
  registerMiddleware('api', [
    commonMiddlewares.cors({ origins: ['https://yourdomain.com'] }),
    commonMiddlewares.logger({ includeBody: false }),
    commonMiddlewares.rateLimit(1000, 60000)
  ]);
}
```

### Role-Based Groups
```typescript
registerMiddleware('public', [
  commonMiddlewares.cors(),
  commonMiddlewares.logger({ includeBody: false })
]);

registerMiddleware('user', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(100, 60000),
  commonMiddlewares.logger({ includeBody: false })
]);

registerMiddleware('admin', [
  commonMiddlewares.requireAuth('/login'),
  requireAdminRole(), // Custom middleware
  commonMiddlewares.rateLimit(20, 60000),
  commonMiddlewares.logger({ includeBody: true }),
  auditLogMiddleware() // Custom middleware
]);
```

### Feature-Based Groups
```typescript
registerMiddleware('payment', [
  commonMiddlewares.requireAuth('/login'),
  validatePaymentAccess(),
  encryptSensitiveData(),
  auditPaymentAction()
]);

registerMiddleware('upload', [
  commonMiddlewares.requireAuth('/login'),
  validateFilePermissions(),
  virusScanMiddleware(),
  commonMiddlewares.rateLimit(10, 60000)
]);
```

## Combining Multiple Groups

### Array Syntax
```typescript
// Combine multiple registered groups
export const loader = createLoaderFromRegistry(['auth', 'logging', 'security']);
```

### Execution Order
```typescript
registerMiddleware('auth', [authMiddleware]);
registerMiddleware('logging', [logMiddleware]);
registerMiddleware('security', [corsMiddleware, rateLimitMiddleware]);

// Executes in order: auth → logging → security
export const loader = createLoaderFromRegistry(['auth', 'logging', 'security']);
```

## Advanced Registry Usage

### Dynamic Registration
```typescript
// Dynamic registration based on feature flags
const featureFlags = await getFeatureFlags();

if (featureFlags.enableAdvancedAuth) {
  registerMiddleware('protected', [
    commonMiddlewares.requireAuth('/login'),
    twoFactorAuthMiddleware(), // Only if feature enabled
    commonMiddlewares.rateLimit(50, 60000)
  ]);
} else {
  registerMiddleware('protected', [
    commonMiddlewares.requireAuth('/login'),
    commonMiddlewares.rateLimit(50, 60000)
  ]);
}
```

### Conditional Middleware
```typescript
const createConditionalGroup = (condition: boolean, name: string, middlewares: Middleware[]) => {
  if (condition) {
    registerMiddleware(name, middlewares);
  } else {
    registerMiddleware(name, []); // Empty group
  }
};

// Only register analytics in production
createConditionalGroup(
  process.env.NODE_ENV === 'production',
  'analytics',
  [analyticsMiddleware(), performanceMiddleware()]
);
```

## Registry Options

### Parallel Execution
```typescript
// Execute all middleware in the group simultaneously
export const loader = createLoaderFromRegistry('api', { 
  parallel: true 
});
```

### Error Handling
```typescript
// Throw errors instead of redirecting
export const loader = createLoaderFromRegistry('protected', { 
  rejectOnError: true 
});

// Redirect to error page on any middleware failure
export const loader = createLoaderFromRegistry('protected', { 
  redirect: '/error' 
});
```

### Combined Options
```typescript
export const loader = createLoaderFromRegistry('api', {
  parallel: true,
  rejectOnError: false,
  redirect: '/api-error'
});
```

## Registry Management

### Listing Registered Groups
```typescript
import { listRegisteredMiddleware } from 'reactr-middleware';

// Get all registered group names
const groups = listRegisteredMiddleware();
console.log('Available groups:', groups);
// Output: ['public', 'protected', 'admin', 'api']
```

### Overwriting Groups
```typescript
// Initial registration
registerMiddleware('api', [corsMiddleware]);

// Later overwrite with new middleware
registerMiddleware('api', [
  corsMiddleware,
  rateLimitMiddleware, // Added
  authMiddleware       // Added
]);
```

## Organization Strategies

### Single Configuration File
```typescript
// middleware.config.ts - All middleware in one place
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';

// Public routes
registerMiddleware('public', [
  commonMiddlewares.cors(),
  commonMiddlewares.logger({ includeBody: false })
]);

// Protected routes
registerMiddleware('protected', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(100, 60000),
  commonMiddlewares.logger({ includeBody: true })
]);

// Admin routes
registerMiddleware('admin', [
  commonMiddlewares.requireAuth('/login'),
  requireRole('admin'),
  commonMiddlewares.rateLimit(20, 60000),
  auditMiddleware()
]);
```

### Feature-Based Files
```typescript
// middleware/auth.config.ts
registerMiddleware('auth', [
  commonMiddlewares.requireAuth('/login'),
  validateSession(),
  refreshTokenIfNeeded()
]);

// middleware/api.config.ts  
registerMiddleware('api', [
  commonMiddlewares.cors(),
  commonMiddlewares.rateLimit(1000, 60000),
  validateApiKey()
]);

// middleware/index.ts
import './auth.config';
import './api.config';
```

### Environment-Based Organization
```typescript
// middleware/development.ts
if (process.env.NODE_ENV === 'development') {
  registerMiddleware('debug', [
    debugMiddleware(),
    performanceMiddleware(),
    memoryUsageMiddleware()
  ]);
}

// middleware/production.ts  
if (process.env.NODE_ENV === 'production') {
  registerMiddleware('monitoring', [
    errorTrackingMiddleware(),
    metricsMiddleware(),
    alertingMiddleware()
  ]);
}
```

## Error Handling

### Non-Existent Groups
```typescript
try {
  const loader = createLoaderFromRegistry('non-existent');
} catch (error) {
  console.error(error.message);
  // "Middleware group 'non-existent' not found. Available groups: public, protected, admin"
}
```

### Empty Groups
```typescript
// Empty groups are valid
registerMiddleware('empty', []);

// This works and creates a no-op loader
export const loader = createLoaderFromRegistry('empty');
```

### Middleware Errors in Groups
```typescript
registerMiddleware('unreliable', [
  reliableMiddleware,
  unreliableMiddleware, // May throw/fail
  anotherReliableMiddleware
]);

// Handle group failures gracefully
export const loader = createLoaderFromRegistry('unreliable', {
  redirect: '/error' // Redirect instead of throwing
});
```

## Best Practices

### 1. Use Descriptive Names
```typescript
// ✅ Good - clear purpose
registerMiddleware('authenticated-api', [...]);
registerMiddleware('public-pages', [...]);

// ❌ Bad - unclear purpose  
registerMiddleware('group1', [...]);
registerMiddleware('stuff', [...]);
```

### 2. Keep Groups Focused
```typescript
// ✅ Good - focused groups
registerMiddleware('auth', [authMiddleware]);
registerMiddleware('security', [corsMiddleware, rateLimitMiddleware]);

// ❌ Bad - mixed concerns
registerMiddleware('everything', [authMiddleware, corsMiddleware, logMiddleware, cacheMiddleware]);
```

### 3. Document Your Groups
```typescript
/**
 * Middleware for public API endpoints
 * - CORS for cross-origin requests
 * - Rate limiting (1000 req/min)  
 * - Basic logging
 */
registerMiddleware('public-api', [
  commonMiddlewares.cors(),
  commonMiddlewares.rateLimit(1000, 60000),
  commonMiddlewares.logger({ includeBody: false })
]);
```

### 4. Import Configuration Early
```typescript
// app/root.tsx
// Import middleware config early to ensure registration
import "./middleware.config";

// Your app code...
```

### 5. Test Registry Integration
```typescript
// registry.test.ts
import { listRegisteredMiddleware, createLoaderFromRegistry } from 'reactr-middleware';
import './middleware.config';

describe('Middleware Registry', () => {
  it('should have required groups', () => {
    const groups = listRegisteredMiddleware();
    expect(groups).toContain('public');
    expect(groups).toContain('protected');
    expect(groups).toContain('admin');
  });
  
  it('should create valid loaders', () => {
    expect(() => createLoaderFromRegistry('public')).not.toThrow();
    expect(() => createLoaderFromRegistry('protected')).not.toThrow();
  });
});
```

::: tip
Start with a few basic groups and expand as your application grows. Most applications need just 3-5 middleware groups to cover all use cases.
:::