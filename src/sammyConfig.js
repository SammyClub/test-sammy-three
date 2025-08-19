// Helper function to determine if worker mode should be used
const shouldUseWorkerMode = () => {
  // Enable worker mode in production or when explicitly set
  return process.env.NODE_ENV === 'production' || process.env.REACT_APP_USE_WORKER_MODE === 'true';
};

/**
 * Creates configuration for the upgraded Sammy 3 Agent Provider
 * Supports new features: MCP, enhanced observability, capture config, and debug options
 */
export const createSammyProviderConfig = ({
  jwtToken,
  onTokenExpired,
  captureMethod = 'render', // Default to 'render' for better compatibility
  enableWorkerMode = shouldUseWorkerMode(),
  enableAudioAggregation = true,
  // New configuration options
  enableMCP = false,
  mcpServers = [],
  enableObservability = true, // Enable observability by default
  debugAudioPerformance = false,
  frameRate = 30,
  captureQuality = 0.9,
  defaultVoice = 'alloy',
}) => {
  // Determine the correct API URL
  const apiUrl = process.env.REACT_APP_SAMMY_API_URL || 'https://app.sammylabs.com';
  
  console.log('[SammyConfig] Using API URL:', apiUrl);
  console.log('[SammyConfig] JWT Token present:', !!jwtToken);
  console.log('[SammyConfig] MCP enabled:', enableMCP);
  console.log('[SammyConfig] Observability enabled:', enableObservability || process.env.REACT_APP_ENABLE_OBSERVABILITY === 'true');
  console.log('[SammyConfig] Worker mode enabled:', enableWorkerMode);
  console.log('[SammyConfig] Audio aggregation enabled:', enableAudioAggregation);

  // Build comprehensive observability configuration with your specified defaults
  const observabilityConfig = {
    // Core settings - enabled by default
    enabled: enableObservability || process.env.REACT_APP_ENABLE_OBSERVABILITY === 'true',
    logToConsole: true,              // Console logging enabled by default
    
    // Privacy settings - include all data by default
    includeSystemPrompt: true,       // Include system prompts
    includeAudioData: true,          // Include raw audio data
    includeImageData: true,          // Include image data
    
    // Worker mode configuration for performance - enabled by default
    useWorker: true,
    workerConfig: {
      batchSize: 50,                 // 50 events per batch
      batchIntervalMs: 5000,         // 5 seconds between batches
    },
    
    // Filter noisy events to reduce log spam
    disableEventTypes: [
      'audio.send',
      'audio.receive',
      // Uncomment to filter more events:
      // 'transcription.input',
      // 'transcription.output',
    ],
    
    // Metadata for all events
    metadata: {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: process.env.REACT_APP_VERSION || '1.0.0',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    }
  };

  // Build MCP (Model Context Protocol) configuration
  const mcpConfig = enableMCP ? {
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
    servers: mcpServers.length > 0 ? mcpServers : [
      // Default MCP server configuration (example)
      {
        name: 'filesystem',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
    ],
  } : undefined;

  // Build capture configuration with quality settings
  const captureConfig = {
    quality: captureQuality || parseFloat(process.env.REACT_APP_CAPTURE_QUALITY) || 0.9,
  };

  return {
    // Screen capture callbacks
    screenCaptureCallbacks: {
      startStreaming: async () => {
        console.log('[ScreenCapture] Starting screen capture with config:', captureConfig);
      },
      stopStreaming: async () => {
        console.log('[ScreenCapture] Stopping screen capture');
      },
    },

    // Core configuration
    debugLogs: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_LOGS === 'true',
    debugAudioPerformance: debugAudioPerformance || process.env.REACT_APP_DEBUG_AUDIO === 'true',
    
    // Voice configuration
    defaultVoice: defaultVoice || process.env.REACT_APP_DEFAULT_VOICE || 'alloy',

    // Capture configuration
    captureMethod,
    captureConfig,

    // Authentication
    auth: {
      token: jwtToken,
      baseUrl: apiUrl,
      onTokenExpired,
    },

    // MCP (Model Context Protocol) configuration
    mcp: mcpConfig,

    // Observability configuration
    observability: observabilityConfig,
  };
};