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

  // Determine the correct API URL
  // Note: The Sammy SDK expects the base URL without /validate endpoint
  const apiUrl = process.env.REACT_APP_SAMMY_API_URL || 'https://app.sammylabs.com';
  
  console.log('[SammyConfig] Using API URL:', apiUrl);
  console.log('[SammyConfig] JWT Token present:', !!jwtToken);

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
    debugLogs: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_LOGS === 'true',
    captureMethod,
    model: 'models/gemini-live-2.5-flash-preview',

    // Authentication
    auth: {
      token: jwtToken,
      baseUrl: apiUrl,
      onTokenExpired,
    },

    // Observability - all API calls handled automatically by worker
    observability: observabilityConfig,
    
    // CORS configuration for development
    // Note: This might not be used by the SDK but included for completeness
    cors: {
      credentials: 'include',
      mode: 'cors',
    },
  };
};