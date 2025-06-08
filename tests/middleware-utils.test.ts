import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLoader,
  createLoaderFromRegistry,
  registerMiddleware,
  commonMiddlewares,
  type Middleware,
  type MiddlewareContext,
} from '../src/middleware-utils';
import { redirect } from 'react-router';

// Mock React Router
vi.mock('react-router', () => ({
  redirect: vi.fn((url: string) => ({ type: 'redirect', url })),
}));

// Mock LoaderFunctionArgs
interface MockLoaderArgs {
  request: Request;
  params: Record<string, string>;
  context?: any;
}

describe('Middleware Router', () => {
  let mockContext: MiddlewareContext;
  let mockRequest: Request;
  let mockLoaderArgs: MockLoaderArgs;

  beforeEach(() => {
    mockRequest = new Request('http://localhost:3000/test?param=value');
    mockContext = {
      request: mockRequest,
      params: { id: '123' },
      searchParams: new URLSearchParams('param=value'),
      pathname: '/test',
    };

    mockLoaderArgs = {
      request: mockRequest,
      params: { id: '123' },
      context: {},
    };

    // Clear registry before each test
    vi.clearAllMocks();
  });

  describe('Sequential Middleware Execution', () => {
    it('should execute middlewares in sequence', async () => {
      const executionOrder: number[] = [];

      const middleware1: Middleware = async () => {
        executionOrder.push(1);
        return { continue: true, data: { step1: 'completed' } };
      };

      const middleware2: Middleware = async () => {
        executionOrder.push(2);
        return { continue: true, data: { step2: 'completed' } };
      };

      const loader = createLoader([middleware1, middleware2]);
      const result = await loader(mockLoaderArgs as any);

      expect(executionOrder).toEqual([1, 2]);
      expect((result as any).middlewareData).toEqual({
        step1: 'completed',
        step2: 'completed',
      });
    });

    it('should stop execution when middleware returns continue: false', async () => {
      const executionOrder: number[] = [];

      const middleware1: Middleware = async () => {
        executionOrder.push(1);
        return { continue: false, data: { error: 'failed' } };
      };

      const middleware2: Middleware = async () => {
        executionOrder.push(2);
        return { continue: true, data: { step2: 'completed' } };
      };

      const loader = createLoader([middleware1, middleware2]);
      const result = await loader(mockLoaderArgs as any);

      expect(executionOrder).toEqual([1]);
      expect((result as any).middlewareData).toEqual({ error: 'failed' });
    });
  });

  describe('Parallel Middleware Execution', () => {
    it('should execute middlewares in parallel', async () => {
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

      const loader = createLoader([middleware1, middleware2], { parallel: true });
      const startTime = Date.now();
      const result = await loader(mockLoaderArgs as any);
      const totalTime = Date.now() - startTime;

      // Should complete in roughly the time of one middleware (parallel execution)
      expect(totalTime).toBeLessThan(80); // Less than sequential (100ms)
      expect((result as any).middlewareData).toEqual({
        step1: 'completed',
        step2: 'completed',
      });
    });

    it('should handle failure in parallel execution', async () => {
      const middleware1: Middleware = async () => {
        return { continue: true, data: { step1: 'completed' } };
      };

      const middleware2: Middleware = async () => {
        return { continue: false, data: { error: 'failed' } };
      };

      const loader = createLoader([middleware1, middleware2], { parallel: true });
      const result = await loader(mockLoaderArgs as any);

      expect((result as any).middlewareData).toEqual({ error: 'failed' });
    });
  });

  describe('Middleware Registry', () => {
    beforeEach(() => {
      // Clear any previously registered middleware
      registerMiddleware('test-group', []);
    });

    it('should register and retrieve middleware groups', () => {
      const testMiddleware: Middleware = async () => ({ continue: true });

      registerMiddleware('test-group', [testMiddleware]);

      const loader = createLoaderFromRegistry('test-group');
      expect(loader).toBeDefined();
    });

    it('should throw error for non-existent middleware group', () => {
      expect(() => {
        createLoaderFromRegistry('non-existent-group');
      }).toThrow('Middleware group "non-existent-group" not found');
    });

    it('should support multiple middleware groups', async () => {
      const middleware1: Middleware = async () => ({
        continue: true,
        data: { from: 'group1' },
      });

      const middleware2: Middleware = async () => ({
        continue: true,
        data: { from: 'group2' },
      });

      registerMiddleware('group1', [middleware1]);
      registerMiddleware('group2', [middleware2]);

      const loader = createLoaderFromRegistry(['group1', 'group2']);
      const result = await loader(mockLoaderArgs as any);

      expect((result as any).middlewareData.from).toBeDefined();
    });
  });

  describe('Common Middlewares', () => {
    describe('requireAuth', () => {
      it('should pass with valid Authorization header', async () => {
        const authRequest = new Request('http://localhost:3000/test', {
          headers: { Authorization: 'Bearer valid-token' },
        });

        const authMiddleware = commonMiddlewares.requireAuth('/login');
        const result = await authMiddleware({
          ...mockContext,
          request: authRequest,
        });

        expect(result.continue).toBe(true);
      });

      it('should redirect without Authorization header', async () => {
        const authMiddleware = commonMiddlewares.requireAuth('/login');
        const result = await authMiddleware(mockContext);

        expect(result.continue).toBe(false);
        expect(result.redirect).toBe('/login');
      });
    });

    describe('cors', () => {
      it('should add CORS headers', async () => {
        const corsMiddleware = commonMiddlewares.cors({
          origins: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
        });

        const result = await corsMiddleware(mockContext);

        expect(result.continue).toBe(true);
        expect(result.headers).toEqual({
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
      });
    });

    describe('rateLimit', () => {
      it('should allow requests within limit', async () => {
        const rateLimitMiddleware = commonMiddlewares.rateLimit(2, 60000);

        const result1 = await rateLimitMiddleware(mockContext);
        const result2 = await rateLimitMiddleware(mockContext);

        expect(result1.continue).toBe(true);
        expect(result2.continue).toBe(true);
      });

      it('should block requests exceeding limit', async () => {
        const rateLimitMiddleware = commonMiddlewares.rateLimit(1, 60000);

        await rateLimitMiddleware(mockContext);
        const result = await rateLimitMiddleware(mockContext);

        expect(result.continue).toBe(false);
        expect(result.headers?.['X-RateLimit-Remaining']).toBe('0');
      });
    });

    describe('logger', () => {
      it('should log request information', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const loggerMiddleware = commonMiddlewares.logger();
        const result = await loggerMiddleware(mockContext);

        expect(result.continue).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/GET \/test/));

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle middleware errors with rejectOnError option', async () => {
      const errorMiddleware: Middleware = async () => {
        throw new Error('Middleware error');
      };

      const loader = createLoader([errorMiddleware], { rejectOnError: true });

      await expect(async () => {
        await loader(mockLoaderArgs as any);
      }).rejects.toThrow('Middleware failed');
    });

    it('should redirect on error when redirect is provided', async () => {
      const errorMiddleware: Middleware = async () => {
        return {
          continue: false,
          redirect: '/',
        };
      };

      const loader = createLoader([errorMiddleware], { redirect: '/' });
      const result = await loader(mockLoaderArgs as any);
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('Data Flow', () => {
    it('should accumulate data from multiple middlewares', async () => {
      const middleware1: Middleware = async () => ({
        continue: true,
        data: { user: 'john', role: 'admin' },
      });

      const middleware2: Middleware = async () => ({
        continue: true,
        data: { timestamp: '2024-01-01', session: 'abc123' },
      });

      const loader = createLoader([middleware1, middleware2]);
      const result = await loader(mockLoaderArgs as any);

      expect((result as any).middlewareData).toEqual({
        user: 'john',
        role: 'admin',
        timestamp: '2024-01-01',
        session: 'abc123',
      });
    });

    it('should accumulate headers from multiple middlewares', async () => {
      const middleware1: Middleware = async () => ({
        continue: true,
        headers: { 'X-Custom-1': 'value1' },
      });

      const middleware2: Middleware = async () => ({
        continue: true,
        headers: { 'X-Custom-2': 'value2' },
      });

      const loader = createLoader([middleware1, middleware2]);
      const result = await loader(mockLoaderArgs as any);

      expect((result as any).headers).toEqual({
        'X-Custom-1': 'value1',
        'X-Custom-2': 'value2',
      });
    });
  });
});
