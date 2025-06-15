import { registerMiddleware, commonMiddlewares } from '../../../src';
// Register middleware groups centrally
registerMiddleware("public", [
  commonMiddlewares.logger({ includeBody: false }),
  commonMiddlewares.cors(),
]);

registerMiddleware("protected", [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.rateLimit(50, 60000),
]);

registerMiddleware("admin", [
  commonMiddlewares.logger({ includeBody: true }),
  commonMiddlewares.requireAuth('/login'),
  commonMiddlewares.rateLimit(20, 60000),
  // Add more admin-specific middleware here
]);

registerMiddleware("api", [
  commonMiddlewares.cors({
    origins: ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
  commonMiddlewares.rateLimit(100, 60000),
  commonMiddlewares.logger({ includeBody: true }),
]);

// You can also register custom middleware combinations
registerMiddleware("profilePage", [
  commonMiddlewares.logger({ includeBody: true }),
  context => {
    console.log('running profilePage middleware');
    return { continue: true, data: { profilePage: 'profilePage' } };
  },
]);

registerMiddleware("productPage",[
  function(context){
    console.log('running productPage1 middleware sequential1');
    return { continue: true, data: { productPage: 'productPage' } };
  },
  {
    parallel:[
      function(context){
        console.log('running productPage2 middleware1 parallel2');
        return { continue: true, data: context.data };
      },
      function(context){
        const data = {...context.data, productPageParallel: 'productPageParallel3'};
        console.log('running productPage3 middleware2 parallel');
        return { continue: true, data: data };
      }
    ],
    sequential:[
      function(context){
        const data = {...context.data, productPageSequential: 'productPageSequential4'};
        console.log('running productPage4 middleware sequential');
        return { continue: true, data: data };
      }
    ]
  },
  function(context){
    const data = {...context.data, productPageSequential5: 'productPageSequential5'};
    console.log('running productPage5 middleware sequential');
    return { continue: true, data };
  }
])
