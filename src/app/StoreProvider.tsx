'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../lib/store';
import { persistStore } from 'redux-persist';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  const persistorRef = useRef<any>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);
  }

  // Render children immediately — don't use PersistGate which renders null
  // during rehydration, causing hydration mismatch and discarding SSR HTML.
  // Redux persist rehydrates in the background; UI state (theme, sidebar)
  // will update once ready without blocking the initial render.
  return (
    <Provider store={storeRef.current}>
      {children}
    </Provider>
  );
}
