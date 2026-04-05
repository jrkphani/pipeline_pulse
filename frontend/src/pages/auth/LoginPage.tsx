import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';
import { useIsAuthenticated } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Page — login-03 two-column split layout
// ---------------------------------------------------------------------------

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { mutate: login, isPending, error } = useLogin();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: '/pipeline', replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        void navigate({ to: '/pipeline', replace: true });
      },
    });
  };

  const apiError = error
    ? (error as { body?: { detail?: string }; status?: number }).body?.detail ??
      ((error as { status?: number }).status === 401
        ? 'Incorrect email or password'
        : 'Something went wrong — try again shortly')
    : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left column — login form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Top branding */}
        <div className="flex justify-center gap-2 md:justify-start">
          <img
            src="/logos/pp-icon-mark.svg"
            alt="Pipeline Pulse"
            className="size-7"
            width={28}
            height={28}
          />
          <span className="text-sm font-semibold">Pipeline Pulse</span>
        </div>

        {/* Centered card */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in with your 1CloudHub credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="grid gap-6">
                      {/* Microsoft SSO */}
                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          className="flex w-full justify-center transition-opacity hover:opacity-90"
                        >
                          <img
                            src="/logos/microsoft/ms-symbollockup_signin_light.svg"
                            alt="Sign in with Microsoft"
                            className="block w-full max-w-[215px] dark:hidden"
                          />
                          <img
                            src="/logos/microsoft/ms-symbollockup_signin_dark.svg"
                            alt="Sign in with Microsoft"
                            className="hidden w-full max-w-[215px] dark:block"
                          />
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>

                      {/* Email + Password */}
                      <div className="grid gap-6">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="you@1cloudhub.com"
                            className={cn(
                              errors.email && 'border-destructive focus-visible:ring-destructive',
                            )}
                            {...register('email')}
                          />
                          {errors.email && (
                            <p className="text-xs text-destructive">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <a
                              href="#"
                              className="ml-auto text-sm underline-offset-4 hover:underline"
                            >
                              Forgot password?
                            </a>
                          </div>
                          <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className={cn(
                              errors.password && 'border-destructive focus-visible:ring-destructive',
                            )}
                            {...register('password')}
                          />
                          {errors.password && (
                            <p className="text-xs text-destructive">{errors.password.message}</p>
                          )}
                        </div>

                        {/* API error */}
                        {apiError && (
                          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                            <p className="text-sm text-destructive">{apiError}</p>
                          </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                          {isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Signing in…
                            </>
                          ) : (
                            'Sign in'
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <p className="text-balance text-center text-xs text-muted-foreground">
                Pipeline Pulse v2.0 · 1CloudHub Pte Ltd
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right column — brand panel (hidden on mobile) */}
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-6">
        <img
          src="/logos/login-hero.png"
          alt="Pipeline Pulse — analytics illustration"
          className="w-4/5 max-w-lg rounded-lg object-contain"
        />
        <img
          src="/logos/pp-wordmark-dark.svg"
          alt="Pipeline Pulse"
          className="h-8 w-auto opacity-80"
        />
      </div>
    </div>
  );
}
