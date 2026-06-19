import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    'data-testid'?: string;
  }
}

export {};
