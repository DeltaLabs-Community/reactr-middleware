---
title: Getting Started
---

# Getting Started

## Installation

Install Reactr Middleware using your preferred package manager:

::: code-group

```bash [npm]
npm install reactr-middleware
```

```bash [yarn]
yarn add reactr-middleware
```

```bash [pnpm]
pnpm add reactr-middleware
```

:::

## Quick Start

### Basic Setup

1. **Create a middleware configuration file** (`middleware.config.ts`):

```typescript
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';

// Register middleware groups
registerMiddleware('public', [
  commonMiddlewares.logger({ includeBody: false }),
  commonMiddlewares.cors(),
]);

registerMiddleware('protected', [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(50, 60000),
]);
```

2. **Use middleware in your route files**:

```typescript
// app/routes/profile.tsx
import { createLoaderFromRegistry } from 'reactr-middleware';
import { useLoaderData } from 'react-router';
import '../middleware.config'; // Import to register middleware

export const loader = createLoaderFromRegistry('protected');

export default function Profile() {
  const data = useLoaderData() as { middlewareData: any };
  
  return (
    <div>
      <h1>Profile Page</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

3. **Define your routes** (`app/routes.ts`):

```typescript
import { route, index } from 'reactr-middleware';

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("profile", "routes/profile.tsx"),
];
```

## Core Features

### ✨ **Centralized Middleware Registry**
Define middleware groups once and reuse them across routes:

```typescript
registerMiddleware('api', [
  commonMiddlewares.cors(),
  commonMiddlewares.rateLimit(100, 60000),
  commonMiddlewares.logger({ includeBody: true }),
]);
```

### ⚡ **Parallel Execution**
Run independent middleware simultaneously for better performance:

```typescript
export const loader = createLoaderFromRegistry('api', { 
  parallel: true 
});
```

### 🛡️ **Built-in Common Middlewares**
Ready-to-use middleware for common scenarios:

- **Authentication**: `requireAuth('/login')`
- **CORS**: `cors({ origins: ['*'] })`
- **Rate Limiting**: `rateLimit(100, 60000)`
- **Logging**: `logger({ includeBody: true })`

### 🔄 **Sequential or Parallel Execution**
Choose the execution strategy that fits your needs:

```typescript
// Sequential (default)
export const loader = createLoaderFromRegistry('protected');

// Parallel
export const loader = createLoaderFromRegistry('protected', { 
  parallel: true 
});
```

## Next Steps

- Learn about [Creating custom middleware](/docs/v-1.0.0/middleware)
- Explore the [Registry system](/docs/v-1.0.0/registry)
- Check out [API examples](/api-examples)

::: tip
Start with the built-in common middlewares and gradually add custom ones as your application grows.
:::