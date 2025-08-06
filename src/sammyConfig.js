// Helper function to determine if worker mode should be used
const shouldUseWorkerMode = () => {
  // Enable worker mode in production or when explicitly set
  return process.env.NODE_ENV === 'production' || process.env.REACT_APP_USE_WORKER_MODE === 'true';
};

export const createSammyProviderConfig = ({
  jwtToken,
  onTokenExpired,
  captureMethod,
  enableWorkerMode = shouldUseWorkerMode(),
  enableAudioAggregation = true,
}) => {
  const observabilityConfig = {
    enabled: false,
  };

  return {
    // Screen capture configuration
    screenCaptureCallbacks: {
      startStreaming: async () => {
        console.log('[ScreenCapture] Starting screen capture');
      },
      stopStreaming: async () => {
        console.log('[ScreenCapture] Stopping screen capture');
      },
    },

    // Basic configuration
    debugLogs: process.env.NODE_ENV === 'development',
    captureMethod,
    model: 'models/gemini-live-2.5-flash-preview',

    // Authentication
    auth: {
      token: jwtToken,
      baseUrl: 'http://localhost:8000',
      onTokenExpired,
    },

    // Observability - all API calls handled automatically by worker
    observability: observabilityConfig,
  };
};