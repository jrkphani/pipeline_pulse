import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type LoginCredentials, type RegisterData, type ApiError } from '../lib/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from './useToast';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => apiClient.login(credentials),
    onSuccess: (response) => {
      console.log('✅ Login API Success. Data received:', response);
      
      try {
        console.log('Attempting to update auth state store...');
        setUser(response.user);
        setIsAuthenticated(true);
        queryClient.setQueryData(['current-user'], response.user);
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        
        console.log('✅ Auth state updated. Current state:', useAuthStore.getState());
        
        toast({
          title: 'Login successful',
          description: `Welcome back, ${response.user.firstName || response.user.name || 'User'}!`,
          variant: 'default',
        });
        
        console.log('✅ Login flow completed successfully');
      } catch (error) {
        console.error('❌ FAILED to update auth state:', error);
      }
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: RegisterData) => apiClient.register(userData),
    onSuccess: (response) => {
      setUser(response.user);
      setIsAuthenticated(true);
      queryClient.setQueryData(['current-user'], response.user);
      toast({
        title: 'Registration successful',
        description: `Welcome to Pipeline Pulse, ${response.user.firstName || response.user.name || 'User'}!`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Registration failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear(); // Clear all cached data
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of Pipeline Pulse.',
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Logout failed:', error);
      // Still clear local state even if server logout fails
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast({
        title: 'Logout completed',
        description: 'You have been logged out locally.',
        variant: 'default',
      });
    },
  });
};

export const useCurrentUser = () => {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if unauthorized
  });
};

export const useMyProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.getMyProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<{ email: string; firstName: string; lastName: string }>) =>
      apiClient.updateMyProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['my-profile'], updatedUser);
      queryClient.setQueryData(['current-user'], updatedUser);
      setUser(updatedUser);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Profile update failed:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
};