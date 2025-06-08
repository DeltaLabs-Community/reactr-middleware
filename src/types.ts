export interface MiddlewareContext {
  request: Request;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  pathname: string;
  data?: any;
}

export interface MiddlewareResponse {
  redirect?: string;
  headers?: Record<string, string>;
  data?: any;
  continue: boolean;
}

export type Middleware = (
  context: MiddlewareContext
) => Promise<MiddlewareResponse> | MiddlewareResponse;