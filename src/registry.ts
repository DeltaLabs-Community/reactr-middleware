import { isGroupConfig, isMiddlewareArray, MiddlewareExecutor } from "./middleware-utils.js";
import { Middleware, GroupMiddlewareConfig } from "./types.js";

class MiddlewareRegistry {
  private static middlewareGroups: Map<string, Middleware[] | GroupMiddlewareConfig> = new Map();

  static register(name: string, middlewares: Middleware[] | GroupMiddlewareConfig) {
    this.middlewareGroups.set(name, middlewares);
  }

  static get(name: string): Middleware[] | GroupMiddlewareConfig {
    const middlewares = this.middlewareGroups.get(name);
    if (!middlewares) {
      throw new Error(
        `Middleware group "${name}" not found. Available groups: ${Array.from(this.middlewareGroups.keys()).join(', ')}`
      );
    }
    return middlewares;
  }
  static createLoaderFromGroup(names: string[]): Middleware[] {
    const results = names.map(name => this.get(name));
    if(!results.every((item) => isMiddlewareArray(item))){
      throw new Error("Cannot combine multiple GroupMiddlewareConfig");
    }
    const middlewares: Middleware[] = [];
    for(const result of results){
      if(isMiddlewareArray(result)){
        middlewares.push(...result as Middleware []);
      }
    }
    return middlewares;
  }

  static createLoader(
    name: string | string[],
    parallel: boolean = false,
    rejectOnError: boolean = false,
    redirect?: string
  ) {
    if (Array.isArray(name)) {
      return MiddlewareExecutor.createReactRouterLoader(
        this.createLoaderFromGroup(name),
        parallel,
        rejectOnError,
        redirect
      );
    }
    return MiddlewareExecutor.createReactRouterLoader(this.get(name), parallel, rejectOnError, redirect);
  }

  static list(): string[] {
    return Array.from(this.middlewareGroups.keys());
  }
}

// Convenience functions for the registry
export function registerMiddleware(name: string, middlewares: Middleware[] | GroupMiddlewareConfig) {
  MiddlewareRegistry.register(name, middlewares);
}

export function createLoaderFromRegistry(
  name: string | string[],
  options?: { parallel?: boolean; rejectOnError?: boolean; redirect?: string }
) {
  return MiddlewareRegistry.createLoader(name, options?.parallel, options?.rejectOnError, options?.redirect);
}

export function listRegisteredMiddleware(): string[] {
  return MiddlewareRegistry.list();
}
