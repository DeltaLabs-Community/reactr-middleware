import React from 'react';
import { useLoaderData } from 'react-router';
import { createLoaderFromRegistry } from 'reactr-middleware';
import { ProductPageMiddleware } from './products.middleware.config';

export const loader = createLoaderFromRegistry(ProductPageMiddleware.ProductPage);

const Product = () => {
  const data = useLoaderData();
  console.log(data);
  return <div>Product</div>;
};

export default Product;
