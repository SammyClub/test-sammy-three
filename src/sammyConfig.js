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
  enableObservability = false,
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
  console.log('[SammyConfig] Observability enabled:', enableObservability);

  // Build observability configuration
  const observabilityConfig = {
    enabled: enableObservability || process.env.REACT_APP_ENABLE_OBSERVABILITY === 'true',
    audioAggregation: enableAudioAggregation,
    callback: (event) => {
      // Custom observability event handler
      if (process.env.NODE_ENV === 'development') {
        console.log('[Observability Event]', event);
      }
    },
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