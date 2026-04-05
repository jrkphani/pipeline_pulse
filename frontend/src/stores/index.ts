// Central store barrel — import stores from here for clean import paths
export {
  useAuthStore,
  useCurrentUser,
  useIsAuthenticated,
  useIsSuperuser,
  useUserRole,
} from './auth.store';

export {
  useUIStore,
  useNewDealRequest,
  useRequestNewDeal,
} from './ui.store';

