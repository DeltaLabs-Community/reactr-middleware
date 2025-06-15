import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, redirect, useLoaderData } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
if (typeof window === "undefined") {
  Promise.resolve().then(() => middleware_config).catch((err) => {
    console.error("Error importing middleware config:", err);
  });
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
function meta({}) {
  return [{
    title: "New React Router App"
  }, {
    name: "description",
    content: "Welcome to React Router!"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  return /* @__PURE__ */ jsx("div", {
    children: "Home"
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const Dashboard = () => {
  return /* @__PURE__ */ jsx("div", {
    children: "Dashboard"
  });
};
const dashboard = UNSAFE_withComponentProps(Dashboard);
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: dashboard
}, Symbol.toStringTag, { value: "Module" }));
class MiddlewareExecutor {
  static async executeMiddlewares(middlewares, context, parallel = false, rejectOnError = false, redirect2) {
    let result = { continue: true, data: {}, headers: {} };
    let accumulatedData = {};
    let accumulatedHeaders = {};
    if (parallel && !isGroupConfig(middlewares) && isMiddlewareArray(middlewares)) {
      return this.executeMiddlewaresParallel(middlewares, context, rejectOnError, redirect2);
    } else if (isGroupConfig(middlewares) && !isMiddlewareArray(middlewares)) {
      for (const entry2 of middlewares) {
        if (typeof entry2 === "object" && ("parallel" in entry2 || "sequential" in entry2)) {
          result = await this.executeRegistryMiddleware(entry2, context, rejectOnError, redirect2);
        } else {
          result = await this.executeMiddlewares([entry2], context, parallel, rejectOnError, redirect2);
        }
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error("Middleware failed");
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect2
            };
          }
        }
        if (result.data) {
          accumulatedData = { ...accumulatedData, ...result.data };
          context.data = { ...context.data, ...result.data };
        }
        if (result.headers) {
          accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
        }
      }
    } else if (isMiddlewareArray(middlewares)) {
      for (const middleware of middlewares) {
        result = await middleware(context);
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error("Middleware failed");
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect2
            };
          }
        }
        if (result.data) {
          accumulatedData = { ...accumulatedData, ...result.data };
          context.data = { ...context.data, ...result.data };
        }
        if (result.headers) {
          accumulatedHeaders = { ...accumulatedHeaders, ...result.headers };
        }
      }
    }
    return {
      continue: true,
      data: accumulatedData,
      headers: accumulatedHeaders
    };
  }
  static async executeRegistryMiddleware(middleware, context, rejectOnError = false, redirect2) {
    let result = { continue: true, data: {}, headers: {} };
    let accumulatedData = {};
    let accumulatedHeaders = {};
    for (const key in middleware) {
      if (key === "parallel") {
        result = await this.executeMiddlewaresParallel(middleware[key], context, rejectOnError, redirect2);
      } else if (key === "sequential") {
        result = await this.executeMiddlewares(middleware[key], context, false, rejectOnError, redirect2);
      }
      if (!result.continue) {
        return result;
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
      headers: accumulatedHeaders
    };
  }
  static async executeMiddlewaresParallel(middlewares, context, rejectOnError = false, redirect2) {
    const results = await Promise.all(
      middlewares.map(async (middleware) => {
        const result = await middleware(context);
        if (!result.continue) {
          if (rejectOnError) {
            throw new Error("Middleware failed");
          } else {
            return {
              continue: false,
              data: result.data,
              headers: result.headers,
              redirect: result.redirect || redirect2
            };
          }
        }
        return result;
      })
    );
    let accumulatedData = {};
    let accumulatedHeaders = {};
    for (const result of results) {
      if (!result.continue) {
        return {
          continue: false,
          data: result.data,
          headers: result.headers,
          redirect: result.redirect || redirect2
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
      redirect: redirect2
    };
  }
  static createReactRouterLoader(middlewares, parallel = false, rejectOnError = false, redirect$1) {
    return async ({ request, params }) => {
      try {
        const url = new URL(request.url);
        const context = {
          request,
          params,
          searchParams: url.searchParams,
          pathname: url.pathname
        };
        const result = await this.executeMiddlewares(middlewares, context, parallel, rejectOnError, redirect$1);
        if (result.redirect) {
          return redirect(result.redirect);
        }
        return {
          middlewareData: result.data || {},
          headers: result.headers || {}
        };
      } catch (error) {
        if (redirect$1) {
          return redirect(redirect$1);
        }
        console.error(error);
        throw new Error("Middleware failed");
      }
    };
  }
}
const commonMiddlewares = {
  // Authentication middleware
  requireAuth: (redirectTo = "/login") => {
    return async (context) => {
      const authHeader = context.request.headers.get("Authorization");
      const hasAuth = authHeader && authHeader.startsWith("Bearer ");
      if (!hasAuth) {
        return {
          redirect: redirectTo,
          continue: false
        };
      }
      return { continue: true };
    };
  },
  // CORS middleware
  cors: (options = {}) => {
    return async (context) => {
      const { origins = ["*"], methods = ["GET", "POST", "PUT", "DELETE"] } = options;
      return {
        continue: true,
        headers: {
          "Access-Control-Allow-Origin": origins.join(", "),
          "Access-Control-Allow-Methods": methods.join(", "),
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      };
    };
  },
  // Rate limiting middleware
  rateLimit: (maxRequests = 100, windowMs = 6e4) => {
    const requests = /* @__PURE__ */ new Map();
    return async (context) => {
      const clientId = context.request.headers.get("x-forwarded-for") || "unknown";
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
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": clientData.resetTime.toString()
          }
        };
      }
      return {
        continue: true,
        headers: {
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": (maxRequests - clientData.count).toString(),
          "X-RateLimit-Reset": clientData.resetTime.toString()
        }
      };
    };
  },
  // Logging middleware
  logger: (options = {}) => {
    return async (context) => {
      const start = Date.now();
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${context.request.method} ${context.pathname}`);
      if (options.includeBody && context.request.method !== "GET") {
        try {
          const body = await context.request.clone().text();
          console.log("Request body:", body);
        } catch (e) {
          console.log("Could not parse request body");
        }
      }
      const duration = Date.now() - start;
      console.log(`Request processed in ${duration}ms`);
      return { continue: true };
    };
  }
};
function isGroupConfig(obj) {
  return Array.isArray(obj) && obj.length > 0 && obj.every(
    (item) => typeof item === "function" || typeof item === "object" && ("parallel" in item || "sequential" in item)
  );
}
function isMiddlewareArray(obj) {
  return Array.isArray(obj) && obj.length > 0 && obj.every((item) => typeof item === "function");
}
const _MiddlewareRegistry = class _MiddlewareRegistry {
  static register(name, middlewares) {
    this.middlewareGroups.set(name, middlewares);
  }
  static get(name) {
    const middlewares = this.middlewareGroups.get(name);
    if (!middlewares) {
      throw new Error(
        `Middleware group "${name}" not found. Available groups: ${Array.from(this.middlewareGroups.keys()).join(", ")}`
      );
    }
    return middlewares;
  }
  static createLoaderFromGroup(names) {
    const results = names.map((name) => this.get(name));
    if (results.every((item) => isGroupConfig(item))) {
      throw new Error("Cannot combine multiple GroupMiddlewareConfig");
    }
    if (results.some((item) => !Array.isArray(item))) {
      throw new Error("Cannot combine Middleware[] with GroupMiddlewareConfig");
    }
    return [].concat(results[0]);
  }
  static createLoader(name, parallel = false, rejectOnError = false, redirect2) {
    if (Array.isArray(name)) {
      return MiddlewareExecutor.createReactRouterLoader(
        this.createLoaderFromGroup(name),
        parallel,
        rejectOnError,
        redirect2
      );
    }
    return MiddlewareExecutor.createReactRouterLoader(this.get(name), parallel, rejectOnError, redirect2);
  }
  static list() {
    return Array.from(this.middlewareGroups.keys());
  }
};
_MiddlewareRegistry.middlewareGroups = /* @__PURE__ */ new Map();
let MiddlewareRegistry = _MiddlewareRegistry;
function registerMiddleware(name, middlewares) {
  MiddlewareRegistry.register(name, middlewares);
}
function createLoaderFromRegistry(name, options) {
  return MiddlewareRegistry.createLoader(name, options == null ? void 0 : options.parallel, options == null ? void 0 : options.rejectOnError, options == null ? void 0 : options.redirect);
}
var MiddlewareGroup = /* @__PURE__ */ ((MiddlewareGroup2) => {
  MiddlewareGroup2["Public"] = "public";
  MiddlewareGroup2["Protected"] = "protected";
  MiddlewareGroup2["Admin"] = "admin";
  MiddlewareGroup2["Api"] = "api";
  MiddlewareGroup2["ProfilePage"] = "profilePage";
  MiddlewareGroup2["ProductPage"] = "productPage";
  return MiddlewareGroup2;
})(MiddlewareGroup || {});
registerMiddleware("public", [
  commonMiddlewares.logger({ includeBody: false }),
  commonMiddlewares.cors()
]);
registerMiddleware("protected", [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth("/login"),
  commonMiddlewares.rateLimit(50, 6e4)
]);
registerMiddleware("admin", [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth("/login"),
  commonMiddlewares.rateLimit(20, 6e4)
  // Add more admin-specific middleware here
]);
registerMiddleware("api", [
  commonMiddlewares.cors({
    origins: ["http://localhost:3000", "https://yourdomain.com"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }),
  commonMiddlewares.rateLimit(100, 6e4),
  commonMiddlewares.logger({ includeBody: true })
]);
registerMiddleware("profilePage", [
  commonMiddlewares.logger({ includeBody: true }),
  (context) => {
    console.log("running profilePage middleware");
    return { continue: true, data: { profilePage: "profilePage" } };
  }
]);
registerMiddleware("productPage", [
  function(context) {
    console.log("running productPage1 middleware sequential");
    return { continue: true, data: { productPage: "productPage" } };
  },
  {
    parallel: [
      function(context) {
        console.log("running productPage2 middleware1 parallel");
        return { continue: true, data: context.data };
      },
      function(context) {
        const data = { ...context.data, productPageParallel: "productPageParallel" };
        console.log("running productPage3 middleware2 parallel");
        return { continue: true, data };
      }
    ],
    sequential: [
      function(context) {
        const data = { ...context.data, productPageSequential: "productPageSequential" };
        console.log("running productPage4 middleware sequential");
        return { continue: true, data };
      }
    ]
  }
]);
const middleware_config = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MiddlewareGroup
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = createLoaderFromRegistry([MiddlewareGroup.ProfilePage, MiddlewareGroup.ProductPage]);
const profile = UNSAFE_withComponentProps(function Profile() {
  const {
    middlewareData
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsx("h1", {
      children: "Profile Page"
    }), /* @__PURE__ */ jsx("p", {
      children: "Middleware Data:"
    }), /* @__PURE__ */ jsx("pre", {
      children: JSON.stringify(middlewareData, null, 2)
    })]
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: profile,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = createLoaderFromRegistry(MiddlewareGroup.ProductPage);
const Product = () => {
  const {
    middlewareData
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsx("h1", {
      children: "Product"
    }), /* @__PURE__ */ jsx("pre", {
      children: JSON.stringify(middlewareData, null, 2)
    })]
  });
};
const product = UNSAFE_withComponentProps(Product);
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: product,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Dz23nH6G.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BS6j6fnq.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": ["/assets/root-B7PzyNSG.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-DbMGgHO_.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-C6ox6tC0.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile": { "id": "routes/profile", "parentId": "root", "path": "profile", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/profile-DbOZHT40.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/products/product": { "id": "routes/products/product", "parentId": "root", "path": "product/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/product-zalK4Azy.js", "imports": ["/assets/chunk-NL6KNZEE-njEFggvy.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-b62704b1.js", "version": "b62704b1", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/profile": {
    id: "routes/profile",
    parentId: "root",
    path: "profile",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/products/product": {
    id: "routes/products/product",
    parentId: "root",
    path: "product/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
