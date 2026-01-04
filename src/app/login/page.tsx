'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your password to access your LifeOS
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive text-center font-medium">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isPending ? 'Unlocking...' : 'Enter System'}
          </button>
        </form>
      </div>
    </div>
  );
}
