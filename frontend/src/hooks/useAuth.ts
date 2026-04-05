import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginResponse, User } from '@/types/auth';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const authKeys = {
  me: ['auth', 'me'] as const,
};

// ---------------------------------------------------------------------------
// GET /auth/me — verify token + hydrate user on every authenticated mount
// ---------------------------------------------------------------------------

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const user = await apiClient.get<User>('/auth/me');
        setUser(user);
        return user;
      } catch {
        // 401 is caught by apiClient and triggers redirect — this handles
        // other errors (network, 5xx) gracefully without clearing auth state
        clearAuth();
        throw new Error('Session verification failed');
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,   // 5 min — re-validates on focus/remount
    refetchOnWindowFocus: true,  // re-check on tab switch
  });
}

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.postForm<LoginResponse>('/auth/login', {
        username: credentials.email,  // OAuth2PasswordRequestForm uses 'username'
        password: credentials.password,
      }),

    onSuccess: (data) => {
      setUser(data.user);
      // Pre-populate the me query so the first authenticated page load is instant
      qc.setQueryData(authKeys.me, data.user);
    },
  });
}

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSettled: () => {
      clearAuth();
      qc.clear();
      window.location.href = '/auth/login';
    },
  });
}
