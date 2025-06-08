import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerMiddleware,
  createLoaderFromRegistry,
  listRegisteredMiddleware,
  commonMiddlewares,
  type Middleware,
  type MiddlewareContext,
} from '../src/middleware-utils';

// Mock React Router
vi.mock('react-router', () => ({
  redirect: vi.fn((url: string) => ({ type: 'redirect', url })),
}));

describe('Middleware Registry', () => {
  let mockContext: MiddlewareContext;
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = new Request('http://localhost:3000/test?param=value');
    mockContext = {
      request: mockRequest,
      params: { id: '123' },
      searchParams: new URLSearchParams('param=value'),
      pathname: '/test',
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Note: Registry state persists between tests intentionally for some tests
    // Individual tests will clear what they need
  });

  describe('Basic Registration and Retrieval', () => {
    it('should register a middleware group and retrieve it', () => {
      const testMiddleware: Middleware = async () => ({
        continue: true,
        data: { test: 'data' },
      });

      registerMiddleware('test-group', [testMiddleware]);

      const loader = createLoaderFromRegistry('test-group');
      expect(loader).toBeDefined();
      expect(typeof loader).toBe('function');
    });

    it('should list registered middleware groups', () => {
      registerMiddleware('group1', []);
      registerMiddleware('group2', []);

      const groups = listRegisteredMiddleware();
      expect(groups).toContain('group1');
      expect(groups).toContain('group2');
    });

    it('should throw error for non-existent middleware group', () => {
      expect(() => {
        createLoaderFromRegistry('non-existent-group');
      }).toThrow('Middleware group "non-existent-group" not found');
    });

    it('should throw error with helpful message listing available groups', () => {
      registerMiddleware('available-group', []);

      try {
        createLoaderFromRegistry('missing-group');
      } catch (error: any) {
        expect(error.message).toContain('available-group');
        expect(error.message).toContain('Available groups:');
      }
    });
  });

  describe('Multiple Middleware Groups', () => {
    it('should combine multiple middleware groups in order', async () => {
      const middleware1: Middleware = async () => ({
        continue: true,
        data: { step: 1, from: 'group1' },
      });

      const middleware2: Middleware = async () => ({
        continue: true,
        data: { step: 2, from: 'group2' },
      });

      const middleware3: Middleware = async () => ({
        continue: true,
        data: { step: 3, from: 'group2' },
      });

      registerMiddleware('auth-group', [middleware1]);
      registerMiddleware('logging-group', [middleware2, middleware3]);

      const loader = createLoaderFromRegistry(['auth-group', 'logging-group']);
      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      // Should have data from all middleware in order
      expect((result as any).middlewareData).toEqual({
        step: 3, // Last middleware wins for same keys
        from: 'group2', // Last middleware wins
      });
    });

    it('should handle empty middleware groups', async () => {
      registerMiddleware('empty-group', []);

      const loader = createLoaderFromRegistry('empty-group');
      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect((result as any).middlewareData).toEqual({});
    });
  });

  describe('Registry with Common Middlewares', () => {
    it('should register and use common middleware patterns', async () => {
      registerMiddleware('public-api', [
        commonMiddlewares.cors({
          origins: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
        }),
        commonMiddlewares.logger({ includeBody: false }),
      ]);

      const loader = createLoaderFromRegistry('public-api');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect((result as any).headers).toEqual({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/GET \/test/));

      consoleSpy.mockRestore();
    });

    it('should register protected routes with auth middleware', async () => {
      registerMiddleware('protected', [
        commonMiddlewares.requireAuth('/login'),
        commonMiddlewares.rateLimit(10, 60000),
      ]);

      const loader = createLoaderFromRegistry('protected');
      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      // Should redirect due to missing auth
      expect(result).toEqual({ type: 'redirect', url: '/login' });
    });
  });

  describe('Registry with Options', () => {
    it('should support parallel execution option', async () => {
      const startTimes: number[] = [];

      const middleware1: Middleware = async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        return { continue: true, data: { step1: 'completed' } };
      };

      const middleware2: Middleware = async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        return { continue: true, data: { step2: 'completed' } };
      };

      registerMiddleware('parallel-test', [middleware1, middleware2]);

      const loader = createLoaderFromRegistry('parallel-test', { parallel: true });
      const startTime = Date.now();
      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);
      const totalTime = Date.now() - startTime;

      // Should complete faster than sequential execution
      expect(totalTime).toBeLessThan(80); // Less than 2 * 50ms
      expect((result as any).middlewareData).toEqual({
        step1: 'completed',
        step2: 'completed',
      });
    });

    it('should support rejectOnError option', async () => {
      const errorMiddleware: Middleware = async () => {
        throw new Error('Test error');
      };

      registerMiddleware('error-test', [errorMiddleware]);

      const loader = createLoaderFromRegistry('error-test', {
        rejectOnError: true,
      });

      await expect(async () => {
        await loader({
          request: mockRequest,
          params: { id: '123' },
          context: {},
        } as any);
      }).rejects.toThrow('Middleware failed');
    });

    it('should support redirect option on error', async () => {
      const errorMiddleware: Middleware = async () => {
        throw new Error('Test error');
      };

      registerMiddleware('redirect-test', [errorMiddleware]);

      const loader = createLoaderFromRegistry('redirect-test', {
        redirect: '/error-page',
      });

      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect(result).toEqual({ type: 'redirect', url: '/error-page' });
    });
  });

  describe('Dynamic Middleware Registration', () => {
    it('should allow overwriting existing middleware groups', async () => {
      const originalMiddleware: Middleware = async () => ({
        continue: true,
        data: { version: 'original' },
      });

      const updatedMiddleware: Middleware = async () => ({
        continue: true,
        data: { version: 'updated' },
      });

      registerMiddleware('dynamic-group', [originalMiddleware]);

      let loader = createLoaderFromRegistry('dynamic-group');
      let result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect((result as any).middlewareData).toEqual({ version: 'original' });

      // Overwrite the middleware group
      registerMiddleware('dynamic-group', [updatedMiddleware]);

      loader = createLoaderFromRegistry('dynamic-group');
      result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect((result as any).middlewareData).toEqual({ version: 'updated' });
    });

    it('should handle conditional middleware registration', () => {
      const isDevelopment = false; // Simulate production

      if (isDevelopment) {
        registerMiddleware('dev-only', [commonMiddlewares.logger({ includeBody: true })]);
      } else {
        registerMiddleware('production', [
          commonMiddlewares.logger({ includeBody: false }),
          commonMiddlewares.rateLimit(100, 60000),
        ]);
      }

      expect(() => createLoaderFromRegistry('dev-only')).toThrow();
      expect(() => createLoaderFromRegistry('production')).not.toThrow();
    });
  });

  describe('Registry Error Scenarios', () => {
    it('should handle middleware that fails in registry', async () => {
      const failingMiddleware: Middleware = async () => ({
        continue: false,
        data: { error: 'Something went wrong' },
        redirect: '/error',
      });

      const successMiddleware: Middleware = async () => ({
        continue: true,
        data: { success: true },
      });

      registerMiddleware('mixed-results', [failingMiddleware, successMiddleware]);

      const loader = createLoaderFromRegistry('mixed-results');
      const result = await loader({
        request: mockRequest,
        params: { id: '123' },
        context: {},
      } as any);

      // Should redirect due to first middleware failing
      expect(result).toEqual({ type: 'redirect', url: '/error' });
    });
  });

  describe('Registry Performance and Memory', () => {
    it('should handle large numbers of middleware groups', () => {
      // Register many groups
      for (let i = 0; i < 1000; i++) {
        registerMiddleware(`group-${i}`, [async () => ({ continue: true, data: { id: i } })]);
      }

      const groups = listRegisteredMiddleware();
      expect(groups.length).toBeGreaterThanOrEqual(1000);

      // Should be able to retrieve any group
      expect(() => createLoaderFromRegistry('group-500')).not.toThrow();
      expect(() => createLoaderFromRegistry('group-999')).not.toThrow();
    });

    it('should handle complex middleware group combinations', async () => {
      // Create complex nested scenarios
      registerMiddleware('auth', [commonMiddlewares.requireAuth()]);
      registerMiddleware('logging', [commonMiddlewares.logger()]);
      registerMiddleware('security', [commonMiddlewares.cors(), commonMiddlewares.rateLimit(50, 60000)]);

      const complexLoader = createLoaderFromRegistry(['auth', 'logging', 'security']);

      // Add auth header to pass auth middleware
      const authRequest = new Request('http://localhost:3000/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await complexLoader({
        request: authRequest,
        params: { id: '123' },
        context: {},
      } as any);

      expect((result as any).headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'X-RateLimit-Limit': '50',
      });

      consoleSpy.mockRestore();
    });
  });
});
