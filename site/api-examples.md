# API Examples

This page demonstrates common patterns and real-world usage of Reactr Middleware.

## Basic Examples

### Simple Authentication
```typescript
// middleware.config.ts
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';

registerMiddleware('auth', [
  commonMiddlewares.requireAuth('/login')
]);

// routes/dashboard.tsx
import { createLoaderFromRegistry } from 'reactr-middleware';

export const loader = createLoaderFromRegistry('auth');

export default function Dashboard() {
  return <div>Protected Dashboard</div>;
}
```

### API Routes with CORS
```typescript
// API middleware setup
registerMiddleware('api', [
  commonMiddlewares.cors({
    origins: ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }),
  commonMiddlewares.rateLimit(1000, 60000), // 1000 requests per minute
  commonMiddlewares.logger({ includeBody: true })
]);

// routes/api/users.tsx
export const loader = createLoaderFromRegistry('api');

export async function action({ request }: ActionFunctionArgs) {
  // Your API logic here
  return json({ success: true });
}
```

## Advanced Patterns

### Multi-Tenant Application
```typescript
// Tenant-specific middleware
const tenantMiddleware = (): Middleware => {
  return async (context) => {
    const subdomain = context.request.headers.get('host')?.split('.')[0];
    const tenant = await getTenantBySubdomain(subdomain);
    
    if (!tenant) {
      return { continue: false, redirect: '/tenant-not-found' };
    }
    
    return {
      continue: true,
      data: { tenant, tenantId: tenant.id }
    };
  };
};

registerMiddleware('tenant-protected', [
  tenantMiddleware(),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(100, 60000)
]);

// routes/tenant/dashboard.tsx
export const loader = createLoaderFromRegistry('tenant-protected');

export default function TenantDashboard() {
  const { middlewareData } = useLoaderData();
  const { tenant } = middlewareData;
  
  return (
    <div>
      <h1>{tenant.name} Dashboard</h1>
      {/* Tenant-specific content */}
    </div>
  );
}
```

### E-commerce with Role-Based Access
```typescript
// Custom role middleware
const requireRole = (role: string): Middleware => {
  return async (context) => {
    const { user } = context.data || {};
    
    if (!user || !user.roles?.includes(role)) {
      return { 
        continue: false, 
        redirect: '/unauthorized' 
      };
    }
    
    return { continue: true };
  };
};

// Different access levels
registerMiddleware('customer', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(200, 60000)
]);

registerMiddleware('vendor', [
  commonMiddlewares.requireAuth('/login'),
  requireRole('vendor'),
  commonMiddlewares.rateLimit(500, 60000)
]);

registerMiddleware('admin', [
  commonMiddlewares.requireAuth('/login'),
  requireRole('admin'),
  commonMiddlewares.rateLimit(1000, 60000),
  auditLogMiddleware()
]);

// Usage in routes
export const customerLoader = createLoaderFromRegistry('customer');
export const vendorLoader = createLoaderFromRegistry('vendor');
export const adminLoader = createLoaderFromRegistry('admin');
```

### Payment Processing
```typescript
// Payment-specific middleware
const paymentSecurityMiddleware = (): Middleware => {
  return async (context) => {
    // Validate SSL
    if (!context.request.url.startsWith('https://')) {
      return { continue: false, redirect: '/security-error' };
    }
    
    // Check for required headers
    const requiredHeaders = ['x-payment-signature', 'x-timestamp'];
    for (const header of requiredHeaders) {
      if (!context.request.headers.get(header)) {
        return { continue: false, redirect: '/payment-error' };
      }
    }
    
    return { continue: true };
  };
};

registerMiddleware('payment', [
  paymentSecurityMiddleware(),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(10, 60000), // Stricter rate limiting
  encryptionMiddleware(),
  auditMiddleware()
]);

// routes/payment/process.tsx
export const loader = createLoaderFromRegistry('payment');
```

## Parallel Execution Examples

### Independent Operations
```typescript
// These middleware don't depend on each other
registerMiddleware('parallel-safe', [
  commonMiddlewares.cors(),
  commonMiddlewares.logger(),
  analyticsMiddleware(),
  metricsMiddleware()
]);

// Execute in parallel for better performance
export const loader = createLoaderFromRegistry('parallel-safe', { 
  parallel: true 
});
```

### Mixed Sequential and Parallel
```typescript
// Some operations must be sequential, others can be parallel
const sequentialLoader = createLoader([
  // These must run in order
  authMiddleware,
  userDataMiddleware, // Needs auth data
  
  // These can run in parallel after auth
  createLoader([
    analyticsMiddleware,
    loggingMiddleware,
    metricsMiddleware
  ], { parallel: true })
]);
```

## Error Handling Patterns

### Graceful Degradation
```typescript
const gracefulMiddleware = (): Middleware => {
  return async (context) => {
    try {
      const externalData = await fetchExternalService();
      return { continue: true, data: { external: externalData } };
    } catch (error) {
      console.warn('External service failed, continuing without data');
      return { continue: true, data: { external: null } };
    }
  };
};

registerMiddleware('resilient', [
  commonMiddlewares.requireAuth('/login'),
  gracefulMiddleware(),
  cacheMiddleware()
]);
```

### Error Boundaries
```typescript
registerMiddleware('strict', [
  criticalMiddleware1(),
  criticalMiddleware2()
]);

// Fail fast on any error
export const loader = createLoaderFromRegistry('strict', {
  rejectOnError: true
});

// Or redirect to error page
export const loader = createLoaderFromRegistry('strict', {
  redirect: '/system-error'
});
```

## Testing Examples

### Unit Testing Middleware
```typescript
// middleware.test.ts
import { authMiddleware } from './auth';

describe('authMiddleware', () => {
  it('should allow authenticated requests', async () => {
    const context = {
      request: new Request('http://localhost:3000/test', {
        headers: { Authorization: 'Bearer valid-token' }
      }),
      params: {},
      searchParams: new URLSearchParams(),
      pathname: '/test'
    };
    
    const result = await authMiddleware(context);
    expect(result.continue).toBe(true);
  });
  
  it('should reject unauthenticated requests', async () => {
    const context = {
      request: new Request('http://localhost:3000/test'),
      params: {},
      searchParams: new URLSearchParams(),
      pathname: '/test'
    };
    
    const result = await authMiddleware(context);
    expect(result.continue).toBe(false);
    expect(result.redirect).toBe('/login');
  });
});
```

### Integration Testing
```typescript
// registry.test.ts
import { createLoaderFromRegistry } from 'reactr-middleware';
import './middleware.config';

describe('Middleware Integration', () => {
  it('should handle protected routes', async () => {
    const loader = createLoaderFromRegistry('protected');
    
    const mockArgs = {
      request: new Request('http://localhost:3000/protected', {
        headers: { Authorization: 'Bearer valid-token' }
      }),
      params: {},
      context: {}
    };
    
    const result = await loader(mockArgs);
    expect(result.middlewareData).toBeDefined();
  });
});
```

## Performance Optimization

### Conditional Middleware Loading
```typescript
// Only load expensive middleware when needed
const conditionalMiddleware = (condition: () => boolean, middleware: Middleware): Middleware => {
  return async (context) => {
    if (!condition()) {
      return { continue: true };
    }
    return middleware(context);
  };
};

registerMiddleware('optimized', [
  commonMiddlewares.requireAuth('/login'),
  conditionalMiddleware(
    () => process.env.NODE_ENV === 'production',
    analyticsMiddleware()
  ),
  conditionalMiddleware(
    () => featureFlags.enableAudit,
    auditMiddleware()
  )
]);
```

### Caching Middleware Results
```typescript
const cachedMiddleware = (middleware: Middleware, ttl: number = 300): Middleware => {
  const cache = new Map();
  
  return async (context) => {
    const key = `${context.pathname}-${context.request.headers.get('authorization')}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl * 1000) {
      return cached.result;
    }
    
    const result = await middleware(context);
    cache.set(key, { result, timestamp: Date.now() });
    
    return result;
  };
};
```

## Real-World Application Structure

### File Organization
```
app/
├── middleware/
│   ├── index.ts           # Main configuration
│   ├── auth.ts           # Authentication middleware
│   ├── security.ts       # Security-related middleware
│   └── analytics.ts      # Analytics middleware
├── routes/
│   ├── admin/
│   │   └── dashboard.tsx  # Uses 'admin' middleware
│   ├── api/
│   │   └── users.tsx     # Uses 'api' middleware
│   └── profile.tsx       # Uses 'protected' middleware
└── utils/
    └── middleware-test-helpers.ts
```

### Main Configuration
```typescript
// app/middleware/index.ts
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';
import { authMiddleware, requireRole } from './auth';
import { securityMiddleware } from './security';
import { analyticsMiddleware } from './analytics';

// Public routes
registerMiddleware('public', [
  commonMiddlewares.cors(),
  commonMiddlewares.logger({ includeBody: false }),
  analyticsMiddleware()
]);

// Protected user routes
registerMiddleware('protected', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(100, 60000),
  analyticsMiddleware()
]);

// Admin routes
registerMiddleware('admin', [
  commonMiddlewares.requireAuth('/login'),
  requireRole('admin'),
  securityMiddleware(),
  commonMiddlewares.rateLimit(20, 60000),
  auditMiddleware()
]);

// API routes
registerMiddleware('api', [
  commonMiddlewares.cors({
    origins: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['*']
  }),
  commonMiddlewares.rateLimit(1000, 60000),
  commonMiddlewares.logger({ includeBody: true })
]);
```

This structure provides a solid foundation for most React Router applications with middleware needs.
