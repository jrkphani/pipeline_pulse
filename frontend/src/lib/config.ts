interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    realTimeSync: boolean;
    advancedAnalytics: boolean;
    bulkOperations: boolean;
  };
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: (import.meta.env.VITE_ENVIRONMENT as AppConfig['environment']) || 'development',
  features: {
    realTimeSync: import.meta.env.VITE_FEATURE_REAL_TIME_SYNC === 'true',
    advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true',
    bulkOperations: import.meta.env.VITE_FEATURE_BULK_OPERATIONS === 'true',
  },
};

const validateConfig = (config: AppConfig): void => {
  if (!config.apiUrl) {
    throw new Error('VITE_API_URL is required');
  }
  if (!['development', 'staging', 'production'].includes(config.environment)) {
    throw new Error('Invalid VITE_ENVIRONMENT value');
  }
};

validateConfig(config);

export { config };
export type { AppConfig };