import { createLoaderFromRegistry } from 'reactr-middleware';
import { useLoaderData } from 'react-router';
import { MiddlewareGroup } from '~/middleware.config';
import type { Route } from './+types/profile';

// Use centralized middleware configuration
export const loader = createLoaderFromRegistry(MiddlewareGroup.ProfilePageParallel, {
  parallel: true,
  rejectOnError: true,
});

// The component
export default function Profile() {
  const data = useLoaderData() as { middlewareData: any };
  return (
    <div>
      <h1>Profile Page</h1>
      <p>Middleware Data:</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
