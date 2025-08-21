/**
 * Sammy Provider Configuration
 * Configuration factory for SammyAgentProvider with worker-based observability and audio aggregation
 * Aligned with working implementation from production
 */

// Helper function to determine if worker mode should be used
const shouldUseWorkerMode = () => {
  // Use worker mode by default, can be disabled via environment variable
  return process.env.REACT_APP_DISABLE_WORKER_MODE !== 'true';
};

export const createSammyProviderConfig = ({
  jwtToken,
  onTokenExpired,
  captureMethod = 'render',
  enableWorkerMode = shouldUseWorkerMode(),
  enableAudioAggregation = true,
  languageCode = 'en-US',
}) => {
  const observabilityConfig = {
    enabled: true,
    logToConsole: process.env.NODE_ENV === 'development',
    includeSystemPrompt: true,
    includeAudioData: false,
    includeImageData: true,

    // Worker mode configuration - handles all API calls automatically
    useWorker: enableWorkerMode,
    workerConfig: enableWorkerMode
      ? {
          batchSize: 50,
          batchIntervalMs: 5000, // 5 seconds - worker handles retries automatically
        }
      : undefined,

    // Filter out noisy events to reduce log spam
    disableEventTypes: [
      'audio.send',
      'audio.receive',
      // Optionally filter other noisy events:
      // 'transcription.input',
      // 'transcription.output',
    ],

    // Metadata for context
    metadata: {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: process.env.REACT_APP_VERSION || '1.0.0',
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    },

    // Audio aggregation configuration - worker handles all API calls automatically
    audioAggregation: enableAudioAggregation
      ? {
          flushIntervalMs: 30000, // 30 seconds
          // No onFlush callback needed - worker handles API calls automatically
        }
      : undefined,

    // No custom callback needed - worker handles all trace events automatically
  };

  // Log the language code for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SammyProvider] Configuring with language: ${languageCode}`);
    console.log('[SammyProvider] JWT Token present:', !!jwtToken);
    console.log('[SammyProvider] Worker mode enabled:', enableWorkerMode);
  }

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

    // Authentication - CRITICAL: Use correct API URL
    auth: {
      token: jwtToken,
      baseUrl:
        process.env.REACT_APP_SAMMY_API_BASE_URL ||
        'https://api-dev.sammylabs.com', // Changed from app.sammylabs.com to api.sammylabs.com
      onTokenExpired,
    },

    // Observability - all API calls handled automatically by worker
    observability: observabilityConfig,

    // Language configuration - the backend confirms this works at runtime
    // even though TypeScript types don't include it yet
    language: { code: languageCode },
  };
};