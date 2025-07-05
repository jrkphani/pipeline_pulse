import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useRegister, useLogout, useCurrentUser } from '../useAuth';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import React from 'react';

// Mock the API client
vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the toast hook
vi.mock('../useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth hooks', () => {
  const mockAuthStore = {
    isAuthenticated: false,
    setUser: vi.fn(),
    setIsAuthenticated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
  });

  describe('useLogin', () => {
    it('should call login API and update auth state on success', async () => {
      const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test' };
      const mockResponse = {
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      (apiClient.login as any).mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      expect(mockAuthStore.setIsAuthenticated).toHaveBeenCalledWith(true);
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      (apiClient.login as any).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAuthStore.setIsAuthenticated).toHaveBeenCalledWith(false);
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('useRegister', () => {
    it('should call register API and update auth state on success', async () => {
      const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test' };
      const mockResponse = {
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      (apiClient.register as any).mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRegister(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      });
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      expect(mockAuthStore.setIsAuthenticated).toHaveBeenCalledWith(true);
    });
  });

  describe('useLogout', () => {
    it('should call logout API and clear auth state', async () => {
      (apiClient.logout as any).mockResolvedValue({});

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.logout).toHaveBeenCalled();
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(null);
      expect(mockAuthStore.setIsAuthenticated).toHaveBeenCalledWith(false);
    });
  });

  describe('useCurrentUser', () => {
    it('should fetch current user when authenticated', async () => {
      const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test' };
      (apiClient.getCurrentUser as any).mockResolvedValue(mockUser);
      
      mockAuthStore.isAuthenticated = true;
      (useAuthStore as any).mockReturnValue({ ...mockAuthStore, isAuthenticated: true });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.getCurrentUser).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockUser);
    });

    it('should not fetch when not authenticated', () => {
      mockAuthStore.isAuthenticated = false;
      (useAuthStore as any).mockReturnValue({ ...mockAuthStore, isAuthenticated: false });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(apiClient.getCurrentUser).not.toHaveBeenCalled();
    });
  });
});