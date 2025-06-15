import { useLoaderData } from 'react-router';
import { createLoaderFromRegistry } from '../../../../../src';
export const loader = createLoaderFromRegistry("productPage");

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
