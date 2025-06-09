import { registerMiddleware, commonMiddlewares } from 'reactr-middleware';
import './routes/products/products.middleware.config';
export enum MiddlewareGroup {
  Public = 'public',
  Protected = 'protected',
  Admin = 'admin',
  Api = 'api',
  ProfilePage = 'profilePage',
  ProfilePageParallel = 'profilePageParallel',
}

// Register middleware groups centrally
registerMiddleware(MiddlewareGroup.Public, [
  commonMiddlewares.logger({ includeBody: false }),
  commonMiddlewares.cors(),
]);

registerMiddleware(MiddlewareGroup.Protected, [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(50, 60000),
]);

registerMiddleware(MiddlewareGroup.Admin, [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(20, 60000),
  // Add more admin-specific middleware here
]);

registerMiddleware(MiddlewareGroup.Api, [
  commonMiddlewares.cors({
    origins: ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
  commonMiddlewares.rateLimit(100, 60000),
  commonMiddlewares.logger({ includeBody: true }),
]);

// You can also register custom middleware combinations
registerMiddleware(MiddlewareGroup.ProfilePage, [
  commonMiddlewares.logger({ includeBody: true }),
  context => {
    console.log('running profilePage middleware');
    return { continue: true, data: { profilePage: 'profilePage' } };
  },
]);

registerMiddleware(MiddlewareGroup.ProfilePageParallel, [
  context => {
    console.log('running profilePageParallel middleware1');
    return { continue: true, data: { profilePageParallel: 'profilePageParallel' } };
  },
  context => {
    console.log('running profilePageParallel middleware2');
    return { continue: true, data: { profilePageParallel: 'profilePageParallel2' } };
  },
  context => {
    console.log('running profilePageParallel middleware3');
    return { continue: false, data: { profilePageParallel: 'profilePageParallel3' } };
  },
]);
