import { useLoaderData } from 'react-router';
import { createLoaderFromRegistry } from '../../../../../src';
import { MiddlewareGroup } from '~/middleware.config';
export const loader = createLoaderFromRegistry(MiddlewareGroup.ProductPage);

const Product = () => {
  const { middlewareData } = useLoaderData();
  return (
    <div>
      <h1>Product</h1>
      <pre>{JSON.stringify(middlewareData, null, 2)}</pre>
    </div>
  );
};

export default Product;
