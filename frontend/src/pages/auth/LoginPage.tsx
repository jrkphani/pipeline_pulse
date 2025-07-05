import React, { useEffect, useState } from "react";
import { useRouter, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLogin } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  
  // Safely get search params with fallback
  const getRedirectPath = (): string => {
    try {
      const search = useSearch({ from: '/auth/login' });
      return (search as any)?.redirect || '/';
    } catch {
      return '/';
    }
  };
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already authenticated, redirect to dashboard or intended page
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = getRedirectPath();
      router.navigate({ to: redirectTo });
    }
  }, [isAuthenticated, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success('Login successful!');
      
      // Redirect to intended page or dashboard
      const redirectTo = getRedirectPath();
      router.navigate({ to: redirectTo });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleZohoLogin = () => {
    // Redirect to your backend's Zoho OAuth initiation endpoint
    // This endpoint will then redirect to Zoho's authorization URL
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/zoho`;
  };

  // For development purposes, add a mock login
  const handleMockLogin = async () => {
    try {
      // Use demo credentials for testing
      await loginMutation.mutateAsync({ 
        email: 'demo@pipelinepulse.com', 
        password: 'demo123' 
      });
      toast.success('Demo login successful!');
    } catch (error) {
      toast.error('Demo login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-pp-neutral-50">
      <div className="flex flex-col gap-6 w-full max-w-lg">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0">
            <form className="p-6 md:p-8" onSubmit={handleEmailLogin}>
              <div className="flex flex-col gap-6">
                {/* Pipeline Pulse Branding */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex items-center justify-center w-[120px] h-[48px] bg-pp-primary-500 text-pp-primary-50 text-lg font-bold rounded-md">
                    Pipeline Pulse
                  </div>
                  <h1 className="text-2xl font-bold text-pp-primary-600">Welcome back</h1>
                  <p className="text-pp-neutral-500 text-balance">
                    Transform your Zoho CRM data into actionable insights
                  </p>
                </div>

                {/* Email Input */}
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-pp-neutral-600">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    className="border-pp-neutral-100 focus:border-pp-primary-500 focus:ring-pp-primary-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-pp-neutral-600">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm text-pp-primary-500 underline-offset-2 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    className="border-pp-neutral-100 focus:border-pp-primary-500 focus:ring-pp-primary-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                {/* Login Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-pp-primary-500 hover:bg-pp-primary-600 text-pp-primary-50"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                {/* Divider */}
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-pp-neutral-100">
                  <span className="bg-white text-pp-neutral-500 relative z-10 px-2">
                    Or continue with
                  </span>
                </div>

                {/* OAuth Buttons */}
                <div className="grid gap-4">
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full border-pp-neutral-100 text-pp-neutral-600 hover:bg-pp-neutral-50"
                    onClick={handleZohoLogin}
                  >
                    <div className="mr-2 h-4 w-4 bg-pp-primary-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                      Z
                    </div>
                    Login with Zoho CRM
                  </Button>
                  
                  {/* Development mock login button */}
                  {import.meta.env.DEV && (
                    <Button
                      onClick={handleMockLogin}
                      variant="outline"
                      type="button"
                      className="w-full border-pp-warning-500 text-pp-warning-600 hover:bg-pp-warning-50"
                      disabled={loginMutation.isPending}
                    >
                      🚀 Mock Login (Dev Only)
                    </Button>
                  )}
                </div>

                {/* Sign up link */}
                <div className="text-center text-sm text-pp-neutral-500">
                  Don&apos;t have an account?{" "}
                  <a href="#" className="text-pp-primary-500 underline underline-offset-4 hover:no-underline">
                    Contact your administrator
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Terms and Privacy */}
        <div className="text-center text-xs text-pp-neutral-500 text-balance">
          By clicking continue, you agree to our{" "}
          <a href="/terms" className="text-pp-primary-500 underline underline-offset-4 hover:no-underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-pp-primary-500 underline underline-offset-4 hover:no-underline">
            Privacy Policy
          </a>.
        </div>
      </div>
    </div>
  );
}