---
title: Middleware
---
# Middleware

Middleware are functions that execute before your route handlers, allowing you to implement cross-cutting concerns like authentication, logging, rate limiting, and more.

## Middleware Concepts

### Middleware Function
A middleware is an async function that receives a context and returns a response:

```typescript
type Middleware = (
  context: MiddlewareContext
) => Promise<MiddlewareResponse> | MiddlewareResponse;
```

### Context Object
Every middleware receives a context with request information:

```typescript
interface MiddlewareContext {
  request: Request;           // The incoming request
  params: Record<string, string>; // Route parameters  
  searchParams: URLSearchParams; // Query parameters
  pathname: string;           // The current pathname
}
```

### Response Object
Middleware must return a response indicating whether to continue:

```typescript
interface MiddlewareResponse {
  continue: boolean;          // Whether to continue to next middleware
  redirect?: string;          // Optional redirect URL
  headers?: Record<string, string>; // Headers to add
  data?: any;                // Data to pass to route/component
}
```

## Creating Custom Middleware

### Basic Example
```typescript
const loggerMiddleware: Middleware = async (context) => {
  console.log(`${context.request.method} ${context.pathname}`);
  
  return {
    continue: true,
    data: { timestamp: new Date().toISOString() }
  };
};
```

### Authentication Middleware
```typescript
const authMiddleware = (redirectTo: string = '/login'): Middleware => {
  return async (context) => {
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        continue: false,
        redirect: redirectTo
      };
    }
    
    // Validate token (implement your own logic)
    const token = authHeader.replace('Bearer ', '');
    const user = await validateToken(token);
    
    if (!user) {
      return {
        continue: false,
        redirect: redirectTo
      };
    }
    
    return {
      continue: true,
      data: { user }
    };
  };
};
```

### Rate Limiting Middleware
```typescript
const rateLimitMiddleware = (
  maxRequests: number = 100, 
  windowMs: number = 60000
): Middleware => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (context) => {
    const clientId = context.request.headers.get('x-forwarded-for') || 
                    context.request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const clientData = requests.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + windowMs;
    }
    
    clientData.count++;
    requests.set(clientId, clientData);
    
    if (clientData.count > maxRequests) {
      return {
        continue: false,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': clientData.resetTime.toString(),
        }
      };
    }
    
    return {
      continue: true,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
        'X-RateLimit-Reset': clientData.resetTime.toString(),
      }
    };
  };
};
```

## Using Middleware

### Direct Usage
Use middleware directly with `createLoader`:

```typescript
import { createLoader } from 'reactr-middleware';

export const loader = createLoader([
  loggerMiddleware,
  authMiddleware('/login'),
  rateLimitMiddleware(50, 60000)
]);
```

### Registry Usage
Register middleware for reuse across routes:

```typescript
// middleware.config.ts
import { registerMiddleware } from 'reactr-middleware';

registerMiddleware('protected', [
  loggerMiddleware,
  authMiddleware('/login'),
  rateLimitMiddleware(50, 60000)
]);

// route file
export const loader = createLoaderFromRegistry('protected');
```

## Execution Modes

### Sequential Execution (Default)
Middleware execute one after another, with data flowing between them:

```typescript
export const loader = createLoader([
  middleware1, // Executes first
  middleware2, // Executes second, receives data from middleware1
  middleware3  // Executes third, receives combined data
]);
```

### Parallel Execution
Independent middleware can run simultaneously for better performance:

```typescript
export const loader = createLoader([
  corsMiddleware,     // Runs in parallel
  rateLimitMiddleware, // Runs in parallel
  loggerMiddleware    // Runs in parallel
], { parallel: true });
```

::: warning
Use parallel execution only when middleware don't depend on each other's results.
:::

### Mixed Execution Patterns (v1.0.3+)
Combine sequential and parallel execution patterns within the same middleware group:

```typescript
registerMiddleware('api', [
  commonMiddlewares.cors(), // Executed first, sequentially
  {
    parallel: [
      // These middleware execute simultaneously
      commonMiddlewares.rateLimit(100, 60000),
      commonMiddlewares.logger({ includeBody: true }),
    ],
    sequential: [
      // These execute in order after parallel group completes
      roleMiddleware(),
      authorizationMiddleware()
    ]
  }
]);
```

#### Execution Flow
In the example above:

1. The `cors` middleware executes first (sequentially)
2. After completion, both `rateLimit` and `logger` middlewares execute simultaneously
3. Once all parallel middlewares complete, `roleMiddleware` executes
4. Finally, `authorizationMiddleware` executes after `roleMiddleware` completes

::: tip
This pattern is useful when you have groups of middleware that can run in parallel, but those groups need to execute in a specific order.
:::

::: warning
Mixed execution patterns have some limitations:
- You cannot mix configuration groups with regular middleware in the same array
- You cannot combine registries that contain multiple middleware groups
:::

## Data Flow

### Passing Data
Middleware can pass data to subsequent middleware and your component:

```typescript
const userMiddleware: Middleware = async (context) => {
  const user = await getCurrentUser(context);
  
  return {
    continue: true,
    data: { user, roles: user.roles }
  };
};

const permissionMiddleware: Middleware = async (context) => {
  // Access data from previous middleware
  const { user, roles } = context.data || {};
  
  if (!roles.includes('admin')) {
    return { continue: false, redirect: '/unauthorized' };
  }
  
  return {
    continue: true,
    data: { permissions: ['read', 'write', 'delete'] }
  };
};
```

### Accessing Data in Components
```typescript
export default function AdminPanel() {
  const { middlewareData } = useLoaderData() as { middlewareData: any };
  const { user, permissions } = middlewareData;
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Permissions: {permissions.join(', ')}</p>
    </div>
  );
}
```

## Error Handling

### Graceful Failures
```typescript
const apiMiddleware: Middleware = async (context) => {
  try {
    const data = await fetchApiData();
    return { continue: true, data };
  } catch (error) {
    // Log error but continue
    console.error('API failed:', error);
    return { continue: true, data: { apiError: true } };
  }
};
```

### Hard Failures
```typescript
const criticalMiddleware: Middleware = async (context) => {
  try {
    await criticalOperation();
    return { continue: true };
  } catch (error) {
    // Stop execution
    return { 
      continue: false, 
      redirect: '/error',
      data: { error: error.message }
    };
  }
};
```

### Loader-Level Error Handling
```typescript
export const loader = createLoader([middleware1, middleware2], {
  rejectOnError: true,  // Throw on middleware errors
  redirect: '/error'    // Redirect on errors instead of throwing
});
```

## Best Practices

### 1. Keep Middleware Focused
Each middleware should have a single responsibility:

```typescript
// ✅ Good - focused on one concern
const authMiddleware = () => { /* only auth logic */ };
const logMiddleware = () => { /* only logging logic */ };

// ❌ Bad - multiple concerns
const authAndLogMiddleware = () => { /* auth + logging */ };
```

### 2. Make Middleware Configurable
```typescript
// ✅ Good - configurable
const cacheMiddleware = (ttl: number = 300) => {
  return async (context) => {
    // Use ttl parameter
  };
};

// ❌ Bad - hardcoded values
const cacheMiddleware = async (context) => {
  const ttl = 300; // Hardcoded
};
```

### 3. Use TypeScript
```typescript
interface AuthData {
  user: User;
  permissions: string[];
}

const authMiddleware: Middleware = async (context) => {
  const authData: AuthData = await authenticate(context);
  return { continue: true, data: authData };
};
```

### 4. Test Middleware Independently
```typescript
// middleware.test.ts
import { authMiddleware } from './auth';

describe('authMiddleware', () => {
  it('should allow valid tokens', async () => {
    const context = createMockContext({ 
      headers: { Authorization: 'Bearer valid-token' } 
    });
    
    const result = await authMiddleware(context);
    expect(result.continue).toBe(true);
  });
});
```

## Common Patterns

### Conditional Middleware
```typescript
const conditionalMiddleware = (condition: boolean, middleware: Middleware): Middleware => {
  return async (context) => {
    if (!condition) {
      return { continue: true };
    }
    return middleware(context);
  };
};

// Usage
registerMiddleware('development', [
  conditionalMiddleware(process.env.NODE_ENV === 'development', debugMiddleware)
]);
```

### Middleware Composition
```typescript
const combineMiddleware = (...middlewares: Middleware[]): Middleware => {
  return async (context) => {
    // Execute all middleware and combine results
    const results = await Promise.all(
      middlewares.map(middleware => middleware(context))
    );
    
    // Custom combination logic
    return {
      continue: results.every(r => r.continue),
      data: Object.assign({}, ...results.map(r => r.data))
    };
  };
};
```

### Group Configuration (v1.0.3+)
```typescript
// Define middleware with mixed execution patterns
const apiMiddlewareGroup = [
  corsMiddleware(),
  {
    parallel: [
      rateLimitMiddleware(100, 60000),
      loggerMiddleware({ includeBody: true }),
    ],
    sequential: [
      roleMiddleware(),
      authorizationMiddleware()
    ]
  },
  anotherMiddleware()
];

// Register the group
registerMiddleware('api', apiMiddlewareGroup);
```

::: tip
Start with built-in middleware and gradually create custom ones as your needs grow. Most applications can get by with just the common middleware patterns.
:::