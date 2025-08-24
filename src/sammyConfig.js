/**
 * Sammy Provider Configuration for v0.1.20+
 * Updated configuration with context injection, click detection, VAD support, and MCP integration
 * @see https://docs.sammylabs.com/configuration
 */

// Configuration validation helper
const validateConfiguration = (config) => {
  const warnings = [];
  const errors = [];

  // Check for required JWT token
  if (!config.auth?.token) {
    errors.push('❌ JWT token is required. Set REACT_APP_JWT_TOKEN in your .env file.');
  }

  // Validate VAD sensitivity
  const validVadSensitivities = ['low', 'medium', 'high', 'custom'];
  if (config.vadConfig?.sensitivity && !validVadSensitivities.includes(config.vadConfig.sensitivity)) {
    warnings.push(`⚠️ Invalid VAD sensitivity: ${config.vadConfig.sensitivity}. Using 'low' as default.`);
  }

  // Validate context mode
  const validContextModes = ['full', 'minimal', 'memory', 'interactive', 'none'];
  const contextMode = process.env.REACT_APP_CONTEXT_MODE;
  if (contextMode && !validContextModes.includes(contextMode)) {
    warnings.push(`⚠️ Invalid context mode: ${contextMode}. Using 'full' as default.`);
  }

  // Validate capture method
  const validCaptureMethods = ['render', 'video'];
  if (config.captureMethod && !validCaptureMethods.includes(config.captureMethod)) {
    warnings.push(`⚠️ Invalid capture method: ${config.captureMethod}. Using 'render' as default.`);
  }

  // Check MCP configuration
  if (config.mcp?.enabled && (!config.mcp.servers || config.mcp.servers.length === 0)) {
    warnings.push('⚠️ MCP is enabled but no servers are configured.');
  }

  // Check target element if specified
  if (config.targetElement && typeof document !== 'undefined') {
    try {
      const element = document.querySelector(config.targetElement);
      if (!element) {
        warnings.push(`⚠️ Target element '${config.targetElement}' not found. Will capture full page.`);
      }
    } catch (e) {
      warnings.push(`⚠️ Invalid target element selector: ${config.targetElement}`);
    }
  }

  // Log validation results
  if (errors.length > 0) {
    console.error('[SammyConfig] Configuration errors:');
    errors.forEach(error => console.error(error));
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[SammyConfig] Configuration warnings:');
    warnings.forEach(warning => console.warn(warning));
  }

  // Return validation result
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Helper function to determine if worker mode should be used
const shouldUseWorkerMode = () => {
  // Use worker mode by default, can be disabled via environment variable
  return process.env.REACT_APP_DISABLE_WORKER_MODE !== 'true';
};

// Helper to parse context injection configuration from environment
const getContextInjectionConfig = () => {
  const contextMode = process.env.REACT_APP_CONTEXT_MODE || 'full';
  
  switch (contextMode) {
    case 'minimal':
      // Only page tracking, no memory or click tracking
      return {
        enabled: true,
        memorySearch: false,
        pageTracking: true,
        clickTracking: false,
      };
    case 'memory':
      // Memory search and page tracking, no click tracking
      return {
        enabled: true,
        memorySearch: true,
        pageTracking: true,
        clickTracking: false,
      };
    case 'interactive':
      // Click and page tracking, no memory search
      return {
        enabled: true,
        memorySearch: false,
        pageTracking: true,
        clickTracking: true,
      };
    case 'none':
      // No context injection (performance mode)
      return false;
    case 'full':
    default:
      // All features enabled (default)
      return true;
  }
};

// Helper to get VAD sensitivity from environment
const getVADSensitivity = () => {
  const sensitivity = process.env.REACT_APP_VAD_SENSITIVITY || 'low';
  // Validate sensitivity value
  if (['low', 'medium', 'high', 'custom'].includes(sensitivity)) {
    return sensitivity;
  }
  return 'low'; // Default to low if invalid value
};

export const createSammyProviderConfig = ({
  jwtToken,
  onTokenExpired,
  captureMethod = 'render',
  enableWorkerMode = shouldUseWorkerMode(),
  enableAudioAggregation = true,
  languageCode = process.env.REACT_APP_LANGUAGE_CODE || 'en-US',
  enableContextInjection = process.env.REACT_APP_ENABLE_CONTEXT !== 'false',
  enableMCP = process.env.REACT_APP_ENABLE_MCP === 'true',
  mcpServers = [],
  vadSensitivity = getVADSensitivity(),
  targetElement = process.env.REACT_APP_TARGET_ELEMENT || undefined,
}) => {
  // Screen capture callbacks (required in v0.1.20+)
  const screenCaptureCallbacks = {
    startStreaming: async () => {
      console.log('[ScreenCapture] Starting screen capture');
      // Return void for render method, MediaStream for video method
    },
    stopStreaming: () => {
      console.log('[ScreenCapture] Stopping screen capture');
    },
  };

  // Build observability configuration
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

  // Build MCP configuration if enabled
  const mcpConfig = enableMCP
    ? {
        enabled: true,
        debug: process.env.NODE_ENV === 'development',
        timeout: parseInt(process.env.REACT_APP_MCP_TIMEOUT) || 45000,
        autoReconnect: process.env.REACT_APP_MCP_AUTO_RECONNECT === 'true',
        reconnectDelay: parseInt(process.env.REACT_APP_MCP_RECONNECT_DELAY) || 5000,
        maxReconnectAttempts: parseInt(process.env.REACT_APP_MCP_MAX_RECONNECTS) || 3,
        servers: mcpServers.length > 0 ? mcpServers : [
          // Default MCP server configuration (example)
          process.env.REACT_APP_MCP_SERVER_URL && {
            name: process.env.REACT_APP_MCP_SERVER_NAME || 'default',
            type: process.env.REACT_APP_MCP_SERVER_TYPE || 'streamableHttp',
            description: process.env.REACT_APP_MCP_SERVER_DESCRIPTION || 'Default MCP Server',
            autoConnect: true,
            streamableHttp: {
              url: process.env.REACT_APP_MCP_SERVER_URL,
            },
          },
        ].filter(Boolean),
      }
    : undefined;

  // Build the final configuration object
  const finalConfig = {
    // Required: Screen capture callbacks
    screenCaptureCallbacks,

    // Authentication configuration
    auth: {
      token: jwtToken,
      baseUrl:
        process.env.REACT_APP_SAMMY_API_BASE_URL ||
        'https://api-dev.sammylabs.com',
      onTokenExpired,
    },

    // NEW in v0.1.20+: Context injection configuration
    // This replaces old tool-based approaches with direct context injection
    contextInjection: enableContextInjection ? getContextInjectionConfig() : false,

    // NEW in v0.1.20+: Voice Activity Detection configuration
    // Helps prevent audio stuttering and false interruptions
    vadConfig: {
      sensitivity: vadSensitivity,
      // Optional: Custom VAD settings when sensitivity is 'custom'
      // customSettings: {
      //   startSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
      //   endSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
      //   prefixPaddingMs: 150,
      //   silenceDurationMs: 500
      // }
    },

    // Language configuration
    language: {
      code: languageCode,
      // Common voice options: 'aoede', 'charon', 'circe', 'fenrir', 'kore', 'puck', 'sol'
      voiceName: process.env.REACT_APP_VOICE_NAME || 'aoede',
    },

    // Screen capture configuration
    captureMethod,
    captureConfig: {
      frameRate: parseInt(process.env.REACT_APP_CAPTURE_FRAME_RATE) || 1,
      quality: parseFloat(process.env.REACT_APP_CAPTURE_QUALITY) || 0.8,
    },

    // Optional: Target specific element for capture (CSS selector, HTMLElement, or RefObject)
    targetElement,

    // Model configuration
    model: process.env.REACT_APP_MODEL || 'models/gemini-live-2.5-flash-preview',

    // Debug settings
    debugLogs: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_LOGS === 'true',
    debugAudioPerformance: process.env.REACT_APP_DEBUG_AUDIO === 'true',

    // Observability configuration with worker mode
    observability: observabilityConfig,

    // Optional: MCP (Model Context Protocol) configuration
    mcp: mcpConfig,
  };

  // Validate configuration
  const validation = validateConfiguration(finalConfig);
  
  // Log configuration for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[SammyProvider] Configuration:');
    console.log('  - Language:', languageCode);
    console.log('  - JWT Token present:', !!jwtToken);
    console.log('  - Worker mode:', enableWorkerMode ? 'enabled' : 'disabled');
    console.log('  - Context injection:', enableContextInjection ? 
      (typeof getContextInjectionConfig() === 'object' ? 
        `custom (memory: ${getContextInjectionConfig().memorySearch}, clicks: ${getContextInjectionConfig().clickTracking})` : 
        'full') : 
      'disabled');
    console.log('  - VAD sensitivity:', vadSensitivity);
    console.log('  - MCP:', enableMCP ? 'enabled' : 'disabled');
    console.log('  - Capture method:', captureMethod);
    console.log('  - Target element:', targetElement || 'none (full page)');
    
    if (validation.warnings.length > 0) {
      console.log('[SammyProvider] Configuration issues:', validation.warnings.length, 'warning(s)');
    }
    
    if (!validation.isValid) {
      console.error('[SammyProvider] ❌ Configuration is invalid!');
    } else {
      console.log('[SammyProvider] ✅ Configuration is valid');
    }
  }

  // Throw error if configuration is invalid
  if (!validation.isValid) {
    throw new Error(`Sammy configuration is invalid: ${validation.errors.join(', ')}`);
  }

  return finalConfig;
};