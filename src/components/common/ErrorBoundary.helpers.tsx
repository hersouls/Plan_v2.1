import React from 'react';
import ErrorBoundary from './ErrorBoundary';

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onReset?: () => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onReset={onReset}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default withErrorBoundary;
