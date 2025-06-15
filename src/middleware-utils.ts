import { GroupMiddlewareConfig, MiddlewareConfigEntry, type Middleware, type MiddlewareContext, type MiddlewareResponse } from './types.js';
import { redirect as routerRedirect, LoaderFunctionArgs } from 'react-router';

class MiddlewareExecutor {
  static async executeMiddlewares(
    middlewares: Middleware[] | GroupMiddlewareConfig,
    context: MiddlewareContext,
    parallel: boolean = false,
    rejectOnError: boolean = false,
    redirect?: string
  ): Promise<MiddlewareResponse> {
    let result:MiddlewareResponse = { continue: true, data: {}, headers: {} };
    let accumulatedData: any = {}; 
    let accumulatedHeaders: Record<string, string> = {};
    
    // Check for empty middleware array
    if (Array.isArray(middlewares) && middlewares.length === 0) {
      throw new Error('Middleware group is empty');
    }

    if (parallel && !isGroupConfig(middlewares) && isMiddlewareArray(middlewares)) {
      return this.executeMiddlewaresParallel(middlewares as Middleware[], context, rejectOnError, redirect);
    }
    else if(isGroupConfig(middlewares) && !isMiddlewareArray(middlewares)){
      for(const entry of middlewares){
        if(typeof entry === 'object' && ('parallel' in entry || 'sequential' in entry)){
          result = await this.executeRegistryMiddleware(entry as MiddlewareConfigEntry, context, rejectOnError, redirect);
        }
        else{
          result = await this.executeMiddlewares([entry] as Middleware[], context, parallel, rejectOnError, redirect);
        }
        
        // Early exit if continue is false
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error('Middleware failed');
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect,
            };
          }
        }
        
        // Accumulate data from all middleware
        if (result.data) {
          accumulatedData = { ...accumulatedData, ...result.data };
          context.data = { ...context.data, ...result.data };
        }
        // Accumulate headers from all middleware
        if (result.headers) {
          accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
        }
      }
    }
    else if(isMiddlewareArray(middlewares)){
      for (const middleware of middlewares) {
        result = await (middleware as Middleware)(context);
  
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error('Middleware failed');
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect,
            };
          }
        }
  
        // Accumulate data from all middleware
        if (result.data) {
          accumulatedData = { ...accumulatedData, ...result.data };
          context.data = { ...context.data, ...result.data };
        }
        // Accumulate headers from all middleware
        if (result.headers) {
          accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
        }
      }
    }
    return {
      continue: true,
      data: accumulatedData,
      headers: accumulatedHeaders,
    };
  }

  static async executeRegistryMiddleware(
    middleware: MiddlewareConfigEntry,
    context: MiddlewareContext,
    rejectOnError: boolean = false,
    redirect?: string
  ): Promise<MiddlewareResponse> {
    let result:MiddlewareResponse = { continue: true, data: {}, headers: {} };
    let accumulatedData: any = {};
    let accumulatedHeaders: Record<string, string> = {};
    // Iterate over the actual keys of the middleware object
    for(const key in middleware) {
      if(key === 'parallel') {
        result = await this.executeMiddlewaresParallel(middleware[key] as Middleware[], context, rejectOnError, redirect);
      }
      else if(key === 'sequential') {
        result = await this.executeMiddlewares(middleware[key] as Middleware[], context, false, rejectOnError, redirect);
      }
      
      if (!result.continue) {
        return result;
      }
      
      // Accumulate results
      if (result.data) {
        accumulatedData = { ...accumulatedData, ...result.data };
        context.data = { ...context.data, ...result.data };
      }
      if (result.headers) {
        accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
      }
    }
      // Accumulation is now handled inside the loop
    return {
      continue: true,
      data: accumulatedData,
      headers: accumulatedHeaders,
    };
  }

  static async executeMiddlewaresParallel(
    middlewares: Middleware[],
    context: MiddlewareContext,
    rejectOnError: boolean = false,
    redirect?: string
  ): Promise<MiddlewareResponse> {
    const results = await Promise.all(
      middlewares.map(async middleware => {
        const result = await middleware(context);
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error('Middleware failed');
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect,
            };
          }
        }
        return result;
      })
    );

    // Accumulate data and headers from all successful middleware
    let accumulatedData: any = {};
    let accumulatedHeaders: Record<string, string> = {};

    for (const result of results) {
      if (!result.continue) {
        return {
          continue: false,
          data: result.data,
          headers: result.headers,
          redirect: result.redirect || redirect,
        };
      }
      if (result.data) {
        accumulatedData = { ...accumulatedData, ...result.data };
        context.data = { ...context.data, ...result.data };
      }
      if (result.headers) {
        accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
      }
    }

    return {
      continue: true,
      data: accumulatedData,
      headers: accumulatedHeaders,
      redirect: redirect,
    };
  }

  static createReactRouterLoader(
    middlewares: Middleware[] | GroupMiddlewareConfig,
    parallel: boolean = false,
    rejectOnError: boolean = false,
    redirect?: string
  ) {
    return async ({ request, params }: LoaderFunctionArgs) => {
      try {
        const url = new URL(request.url);
        const context: MiddlewareContext = {
          request,
          params: params as Record<string, string>,
          searchParams: url.searchParams,
          pathname: url.pathname,
        };

        const result = await this.executeMiddlewares(middlewares, context, parallel, rejectOnError, redirect);

        if (result.redirect) {
          return routerRedirect(result.redirect);
        }

        return {
          middlewareData: result.data || {},
          headers: result.headers || {},
        };
      } catch (error) {
        if (redirect) {
          return routerRedirect(redirect);
        }
        console.error(error);
        throw new Error('Middleware failed');
      }
    };
  }
}

// Utility to create a loader for use in route files
export function createLoader(
  middlewares: Middleware[] | GroupMiddlewareConfig = [],
  options?: { parallel?: boolean; rejectOnError?: boolean; redirect?: string }
) {
  return MiddlewareExecutor.createReactRouterLoader(
    middlewares,
    options?.parallel,
    options?.rejectOnError,
    options?.redirect
  );
}

export const commonMiddlewares = {
  // Authentication middleware
  requireAuth: (redirectTo: string = '/login'): Middleware => {
    return async (context: MiddlewareContext) => {
      // Check for auth token in cookies, headers, etc.
      const authHeader = context.request.headers.get('Authorization');
      const hasAuth = authHeader && authHeader.startsWith('Bearer ');

      if (!hasAuth) {
        return {
          redirect: redirectTo,
          continue: false,
        };
      }

      return { continue: true };
    };
  },

  // CORS middleware
  cors: (options: { origins?: string[]; methods?: string[] } = {}): Middleware => {
    return async (context: MiddlewareContext) => {
      const { origins = ['*'], methods = ['GET', 'POST', 'PUT', 'DELETE'] } = options;

      return {
        continue: true,
        headers: {
          'Access-Control-Allow-Origin': origins.join(', '),
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      };
    };
  },

  // Rate limiting middleware
  rateLimit: (maxRequests: number = 100, windowMs: number = 60000): Middleware => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return async (context: MiddlewareContext) => {
      const clientId = context.request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

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
          },
        };
      }

      return {
        continue: true,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
          'X-RateLimit-Reset': clientData.resetTime.toString(),
        },
      };
    };
  },

  // Logging middleware
  logger: (options: { includeBody?: boolean } = {}): Middleware => {
    return async (context: MiddlewareContext) => {
      const start = Date.now();
      console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.pathname}`);

      if (options.includeBody && context.request.method !== 'GET') {
        try {
          const body = await context.request.clone().text();
          console.log('Request body:', body);
        } catch (e) {
          console.log('Could not parse request body');
        }
      }

      const duration = Date.now() - start;
      console.log(`Request processed in ${duration}ms`);

      return { continue: true };
    };
  },
};

function isGroupConfig(obj: any): boolean {
  if (!Array.isArray(obj) || obj.length === 0) {
    return false;
  }
  return obj.some(item => 
    typeof item === 'object' && 
    item !== null && 
    (('parallel' in item) || ('sequential' in item))
  );
}

function isMiddlewareArray(obj: any): boolean {
  return Array.isArray(obj) &&
    obj.length > 0 &&
    obj.every(item => typeof item === 'function');
}

// Export everything
export { MiddlewareExecutor, isGroupConfig, isMiddlewareArray };
export type { Middleware, MiddlewareContext, MiddlewareResponse };