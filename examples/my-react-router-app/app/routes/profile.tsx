import { useLoaderData } from 'react-router';
import { createLoaderFromRegistry } from '../../../../src';
import { MiddlewareGroup } from '~/middleware.config';
export const loader = createLoaderFromRegistry([MiddlewareGroup.ProfilePage,MiddlewareGroup.Protected]);
// The component
export default function Profile() {
  const { middlewareData } = useLoaderData();
  return (
    <div>
      <h1>Profile Page</h1>
      <p>Middleware Data:</p>
      <pre>{JSON.stringify(middlewareData, null, 2)}</pre>
    </div>
  );
}
