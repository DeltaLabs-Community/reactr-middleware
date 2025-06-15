---
title : Why Reactr Middleware
---

# Why Reactr Middleware?

React Router v7 is powerful, but when building complex applications, you often need to add cross-cutting concerns like authentication, logging, rate limiting, and CORS handling to your routes. **Reactr Middleware** provides a clean, composable solution for these common patterns.

## The Problem

Without middleware, you end up with:

### ❌ Code Duplication
```typescript
// Every protected route needs this
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw redirect('/login');
  }
  
  // Rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(clientId)) {
    throw new Response('Too Many Requests', { status: 429 });
  }
  
  // Logging
  console.log(`${request.method} ${new URL(request.url).pathname}`);
  
  // Your actual route logic
  return { user: getCurrentUser() };
};
```

### ❌ Inconsistent Patterns
Different developers implement the same functionality differently, leading to bugs and maintenance issues.

### ❌ Hard to Test
Cross-cutting concerns are mixed with business logic, making unit testing difficult.

## The Solution

### ✅ **Composable Middleware**
```typescript
// Define once, use everywhere
registerMiddleware('protected', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(50, 60000),
  commonMiddlewares.logger({ includeBody: true }),
]);

// Use in any route
export const loader = createLoaderFromRegistry('protected');
```

### ✅ **Clean Separation**
Business logic stays in your components, cross-cutting concerns are handled by middleware.

### ✅ **Easy Testing**
Test middleware and business logic separately.

## Key Benefits

### 🚀 **Developer Experience**
- **Type Safety**: Full TypeScript support with IntelliSense
- **Hot Reloading**: Changes to middleware reflect immediately
- **Error Handling**: Clear error messages and stack traces

### ⚡ **Performance**
- **Parallel Execution**: Run independent middleware simultaneously
- **Minimal Overhead**: Lightweight implementation with zero dependencies
- **Tree Shaking**: Only bundle what you use

### 🛠️ **Flexibility**
- **Mix and Match**: Combine built-in and custom middleware
- **Registry System**: Organize middleware groups logically
- **Options Support**: Configure behavior per route

### 📦 **Maintainability**
- **Centralized Configuration**: All middleware logic in one place
- **Reusable Patterns**: Define once, use everywhere
- **Easy Updates**: Change middleware behavior globally

## Real-World Example

Before Reactr Middleware:
```typescript
// 50+ lines per protected route
export const profileLoader = async ({ request }: LoaderFunctionArgs) => {
  // Auth check (10 lines)
  // Rate limiting (15 lines)
  // CORS handling (8 lines)
  // Logging (5 lines)
  // Error handling (12 lines)
  
  return { profile: getProfile() }; // Actual logic
};
```

After Reactr Middleware:
```typescript
// 1 line per protected route
export const loader = createLoaderFromRegistry('protected');

// Component focuses on UI
export default function Profile() {
  const { middlewareData } = useLoaderData();
  return <ProfileView data={middlewareData} />;
}
```

## When to Use Reactr Middleware

### ✅ **Perfect For:**
- Applications with authentication requirements
- APIs with rate limiting needs
- Multi-tenant applications
- Applications requiring audit logging
- Complex routing with shared logic

### ⚠️ **Consider Alternatives If:**
- You have a simple static site
- Your app has no cross-cutting concerns
- You prefer inline logic over abstractions

## Migration Path

Reactr Middleware is designed for **zero breaking changes**:

1. **Install** the library
2. **Gradually migrate** routes one by one
3. **Keep existing code** working while you transition
4. **No rush** - migrate at your own pace

::: tip Ready to get started?
Check out our [Getting Started Guide](/docs/v-1.0.3/getting-started) to add middleware to your first route in under 5 minutes.
:::