import { registerMiddleware, commonMiddlewares } from "../../../../../src";
export enum ProductPageMiddleware {
    ProductPage = "productPage",
    ProductPage2 = "productPage2"
}
registerMiddleware(ProductPageMiddleware.ProductPage, [
    commonMiddlewares.logger({ includeBody: true }),
    (context) => {
      console.log("running productPage middleware");
      console.log(context.params);
      return { continue: true, data: { productPage: "productPage", params: context.params },headers: { "X-Custom": "value" } };
    },
    (context) => {
      console.log("running productPage middleware2");
      return { continue: true, data: { productPage: "productPage2", params: context.params },headers: { "X-Custom": "value2" } };
    }
]);