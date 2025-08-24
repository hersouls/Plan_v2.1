import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<Parameters<typeof ProtectedRoute>[0], 'children'>
) {
  const Wrapped = (props: P) => (
    <ProtectedRoute {...(options ?? {})}>
      <Component {...props} />
    </ProtectedRoute>
  );
  Wrapped.displayName = `withProtectedRoute(${
    Component.displayName || Component.name
  })`;
  return Wrapped;
}

export default withProtectedRoute;
