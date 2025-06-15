---
title: Changelog v-1.0.3
---

# Reactr Middleware v1.0.3

## Overview

Version 1.0.3 introduces enhanced middleware execution control, allowing developers to define both parallel and sequential execution patterns within the same middleware group. This release maintains full backward compatibility with previous versions.

## New Features

- **Advanced Middleware Execution Control**: Configure middleware to run in parallel or sequential order within the same group
- **Flexible Middleware Grouping**: Organize middleware execution flow with explicit configuration objects

## Breaking Changes

None. This release is fully backward compatible with existing middleware implementations.

## Implementation Example

```typescript
registerMiddleware('api', [
  commonMiddlewares.cors(), // Executed first, sequentially
  {
    parallel: [
      // These middlewares execute simultaneously
      commonMiddlewares.rateLimit(100, 60000),
      commonMiddlewares.logger({ includeBody: true }),
    ],
    sequential: [
      // These middlewares execute in order after parallel group completes
      roleMiddleware(),
      authorizationMiddleware()
    ]
  }
]);
```

## Technical Details

### Type Definitions

```typescript
export type MiddlewareConfigEntry = {
  parallel?: Middleware[];
  sequential?: Middleware[];
}
export type GroupMiddlewareConfig = (Middleware | MiddlewareConfigEntry)[]
```

### Execution Flow

In the example above:

1. The `cors` middleware executes first (sequentially)
2. After completion, both `rateLimit` and `logger` middlewares execute simultaneously
3. Once all parallel middlewares complete, `roleMiddleware` executes
4. Finally, `authorizationMiddleware` executes after `roleMiddleware` completes
## Limitations and Constraints

:::danger Unsupported Configurations
The following configurations will throw runtime errors:
:::

### 1. Mixing Group Configuration with Reqular Middleware Configuration

You cannot mix configuration groups with regular middleware in the same array:

::: code-group
```typescript [Invalid: Middleware After Group]

// Middleware Array - Valid
registerMiddleware("someGroup",[
    middleware1(),
    middleware2(),
])

// Group - Valid
registerMiddleware('api', [
  commonMiddlewares.cors(),
  {
    parallel: [
      commonMiddlewares.rateLimit(100, 60000),
      commonMiddlewares.logger({ includeBody: true }),
    ],
    sequential: [
      roleMiddleware(),
      authorizationMiddleware()
    ]
  },
  commonMiddlewares.logger()
]);

const loader = createLoaderFromRegistry(["someGroup","api"]); // Error: Cannot mix group with regular middleware

```
:::

### 2. Combining Multiple Middleware Groups

You cannot combine registries that contain multiple middleware groups:

::: code-group
```typescript [Invalid: Multiple Groups]
// First registry with a group
registerMiddleware("auth", [
  {
    parallel: [
      middleware1(),
      middleware2(),
    ],
    sequential: [
      middleware3(),
      middleware4(),
    ]
  }
]);

// Second registry with a group
registerMiddleware('api', [
  commonMiddlewares.cors(),
  {
    parallel: [
      commonMiddlewares.rateLimit(100, 60000),
      commonMiddlewares.logger({ includeBody: true }),
    ],
    sequential: [
      roleMiddleware(),
      authorizationMiddleware()
    ]
  }
]);

// Error: Cannot combine registries with multiple groups
const loader = createLoaderFromRegistry(["api", "auth"]);
```
:::

## Design Considerations

### Intentional Limitations

The current design intentionally limits certain configurations to maintain simplicity and predictability in the middleware system. These limitations are based on several key principles:

1. **Architectural Clarity**: Each middleware registry should have a clear, singular execution pattern that's easy to reason about

2. **Predictable Behavior**: Combining different execution patterns can lead to unexpected behavior and difficult-to-debug issues

3. **Separation of Concerns**: Different middleware groups should typically represent different domains of functionality

### Recommended Patterns

Instead of attempting to combine multiple middleware groups or mixing group configurations with regular middleware, we recommend:

- **Create separate registries** for different functional domains
- **Use composition** at the loader level when appropriate
- **Structure your middleware** with a clear execution flow in mind

## Feedback and Contributions

We welcome feedback on this new feature. If you encounter any issues or have suggestions for improvements, please submit them to our [GitHub repository](https://github.com/DeltaLabs-Community/reactr-middleware/issues).

