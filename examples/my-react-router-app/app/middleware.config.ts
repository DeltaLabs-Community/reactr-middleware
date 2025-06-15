import { registerMiddleware, commonMiddlewares } from '../../../src';
export enum MiddlewareGroup {
  Public = 'public',
  Protected = 'protected',
  Admin = 'admin',
  Api = 'api',
  ProfilePage = 'profilePage',
  ProductPage = 'productPage',
}

export type MiddlewareConfig = keyof typeof MiddlewareGroup;

// Register middleware groups centrally
registerMiddleware(MiddlewareGroup.Public, [
  commonMiddlewares.logger({ includeBody: false }),
  commonMiddlewares.cors(),
]);

registerMiddleware(MiddlewareGroup.Protected, [
  commonMiddlewares.logger({ includeBody: true }),
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

registerMiddleware(MiddlewareGroup.ProductPage,[
  function(context){
    console.log('running productPage1 middleware sequential');
    return { continue: true, data: { productPage: 'productPage' } };
  },
  {
    parallel:[
      function(context){
        console.log('running productPage2 middleware1 parallel');
        return { continue: true, data: context.data };
      },
      function(context){
        const data = {...context.data, productPageParallel: 'productPageParallel'};
        console.log('running productPage3 middleware2 parallel');
        return { continue: true, data: data };
      }
    ],
    sequential:[
      function(context){
        const data = {...context.data, productPageSequential: 'productPageSequential'};
        console.log('running productPage4 middleware sequential');
        return { continue: true, data: data };
      }
    ]
  }
])
