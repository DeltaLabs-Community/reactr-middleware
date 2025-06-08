# Reactr Middleware

> Powerful middleware functionality for React Router v7

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Reactr Middleware** provides a clean, composable solution for implementing cross-cutting concerns like authentication, logging, rate limiting, and CORS handling in React Router v7 applications.

## ✨ Features

- 🚀 **Easy Integration** - Zero breaking changes, works with existing React Router apps
- ⚡ **Parallel & Sequential Execution** - Run middleware simultaneously or in order
- 📦 **Centralized Registry** - Organize middleware groups for better maintainability
- 🛡️ **Built-in Common Middleware** - Auth, CORS, rate limiting, and logging out of the box
- 🎯 **TypeScript First** - Full type safety and IntelliSense support
- 🔄 **Composable** - Mix and match middleware to create complex routing logic
- 📚 **Well Documented** - Comprehensive docs with real-world examples

## 🚀 Quick Start

### Installation

```bash
npm install reactr-middleware
# or
yarn add reactr-middleware
# or
pnpm add reactr-middleware
```

### Basic Usage

1. **Create a middleware configuration**:

```typescript
// middleware.config.ts
import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';

registerMiddleware('protected', [
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(50, 60000),
  commonMiddlewares.logger({ includeBody: true })
]);
```

2. **Use in your route files**:

```typescript
// app/routes/profile.tsx
import { createLoaderFromRegistry } from 'reactr-middleware';
import { useLoaderData } from 'react-router';
import '../middleware.config';

export const loader = createLoaderFromRegistry('protected');

export default function Profile() {
  const { middlewareData } = useLoaderData();
  return <div>Protected Profile Page</div>;
}
```

3. **Update your routes config**:

```typescript
// app/routes.ts
import { route, index } from 'reactr-middleware';

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("profile", "routes/profile.tsx"),
];
```

That's it! Your routes now have authentication, rate limiting, and logging.

## 📋 Built-in Middleware

### Authentication
```typescript
commonMiddlewares.requireAuth('/login')
```

### CORS
```typescript
commonMiddlewares.cors({
  origins: ['http://localhost:3000'],
  methods: ['GET', 'POST']
})
```

### Rate Limiting
```typescript
commonMiddlewares.rateLimit(100, 60000) // 100 requests per minute
```

### Logging
```typescript
commonMiddlewares.logger({ includeBody: true })
```

## 🛠️ Advanced Usage

### Parallel Execution
```typescript
// Run independent middleware simultaneously
export const loader = createLoaderFromRegistry('api', { parallel: true });
```

### Custom Middleware
```typescript
const customMiddleware: Middleware = async (context) => {
  // Your custom logic here
  const user = await validateUser(context.request);
  
  return {
    continue: true,
    data: { user, timestamp: Date.now() }
  };
};

registerMiddleware('custom', [customMiddleware]);
```

### Multiple Groups
```typescript
// Combine multiple middleware groups
export const loader = createLoaderFromRegistry(['auth', 'security', 'logging']);
```

### Error Handling
```typescript
export const loader = createLoaderFromRegistry('protected', {
  rejectOnError: true,  // Throw on errors
  redirect: '/error'    // Or redirect on errors
});
```

## 📖 Documentation

- **[Getting Started](https://your-docs-site.com/docs/v-1.0.0/getting-started)** - Installation and basic setup
- **[Why Reactr Middleware?](https://your-docs-site.com/docs/v-1.0.0/why-reactr-middleware)** - Benefits and use cases
- **[Creating Middleware](https://your-docs-site.com/docs/v-1.0.0/middleware)** - Custom middleware development
- **[Registry System](https://your-docs-site.com/docs/v-1.0.0/registry)** - Organizing middleware groups
- **[API Examples](https://your-docs-site.com/api-examples)** - Real-world usage patterns

## 🎯 Use Cases

Perfect for applications that need:

- **Authentication & Authorization** - Protect routes with user validation
- **API Rate Limiting** - Prevent abuse with configurable limits
- **Cross-Origin Requests** - Handle CORS for web APIs
- **Request Logging** - Track and debug application traffic
- **Multi-tenant Applications** - Route-level tenant isolation
- **Audit Trails** - Log sensitive operations for compliance

## 🔄 Migration

Reactr Middleware is designed for **zero breaking changes**:

1. Install the library
2. Gradually migrate routes one by one  
3. Keep existing code working during transition
4. No rush - migrate at your own pace

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/DeltaLabs-Community/reactr-middleware.git
cd reactr-middleware

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build
```

## 📄 License

MIT © [Delta Labs](https://github.com/DeltaLabs-Community)

## 🙏 Acknowledgments

- Built for [React Router v7](https://reactrouter.com/)
- Inspired by Express.js middleware patterns
- TypeScript-first design for better developer experience

---

**[⭐ Star this project](https://github.com/DeltaLabs-Community/reactr-middleware)** if you find it useful!
