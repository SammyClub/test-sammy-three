import React, { useState, useCallback } from 'react';
import { SammyAgentProvider } from '@sammy-labs/sammy-three';
import logo from './logo.svg';
import './App.css';
import SammyButton from './SammyButton';
import SammyStatus from './SammyStatus';
import { createSammyProviderConfig } from './sammyConfig';
import { SammyStartWalkthroughModal } from './SammyStartWalkthroughModal';

function App() {
  const [sammyActive, setSammyActive] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  // Get JWT token from environment variable
  const jwtToken = process.env.REACT_APP_JWT_TOKEN;
  
  // Handle token expiration
  const handleTokenExpired = useCallback(() => {
    console.log('JWT token expired, need to refresh');
    // In a real app, you would refresh the token here
    setSammyActive(false);
  }, []);
  
  // Create Sammy configuration with upgraded features
  const config = jwtToken ? createSammyProviderConfig({
    jwtToken,
    onTokenExpired: handleTokenExpired,
    captureMethod: 'render',
    
    // New Sammy 3 features - observability enabled by default
    enableObservability: process.env.REACT_APP_ENABLE_OBSERVABILITY !== 'false', // Default to true unless explicitly disabled
    debugAudioPerformance: process.env.REACT_APP_DEBUG_AUDIO === 'true',
    enableMCP: process.env.REACT_APP_ENABLE_MCP === 'true',
    captureQuality: parseFloat(process.env.REACT_APP_CAPTURE_QUALITY) || 0.9,
  }) : null;
  
  // Request permissions for audio and screen capture
  const requestPermissions = useCallback(async () => {
    try {
      // Request microphone permission
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
      
      setPermissionsGranted(true);
      setPermissionError(null);
      console.log('Audio permissions granted');
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionError('Microphone access is required for Sammy to work properly.');
      setPermissionsGranted(false);
      return false;
    }
  }, []);

  // Handle Sammy toggle
  const handleSammyToggle = useCallback(async (isActive) => {
    if (isActive && !permissionsGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        return; // Don't activate if permissions weren't granted
      }
    }
    
    setSammyActive(isActive);
    console.log(`Sammy agent ${isActive ? 'started' : 'stopped'}`);
  }, [permissionsGranted, requestPermissions]);

  const appContent = (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        {!jwtToken && (
          <p style={{ color: '#ff6b6b', marginTop: '20px', fontSize: '14px' }}>
            ⚠️ REACT_APP_JWT_TOKEN not found in environment variables. 
            Sammy agent will not be available.
          </p>
        )}
        {permissionError && (
          <p style={{ color: '#ff6b6b', marginTop: '20px', fontSize: '14px' }}>
            ⚠️ {permissionError}
          </p>
        )}
        {jwtToken && process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left',
            maxWidth: '500px'
          }}>
            <strong>Sammy 3 Configuration:</strong>
            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
              <li>Observability: {process.env.REACT_APP_ENABLE_OBSERVABILITY !== 'false' ? '✅ Enabled (default)' : '❌ Disabled'}</li>
              <li>MCP Protocol: {process.env.REACT_APP_ENABLE_MCP === 'true' ? '✅' : '❌'}</li>
              <li>Audio Debug: {process.env.REACT_APP_DEBUG_AUDIO === 'true' ? '✅' : '❌'}</li>
              <li>Worker Mode: {process.env.NODE_ENV === 'production' || process.env.REACT_APP_USE_WORKER_MODE === 'true' ? '✅' : '❌'}</li>
              <li>Capture Method: render</li>
            </ul>
          </div>
        )}
      </header>
      
      {jwtToken && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <SammyButton 
            onToggle={handleSammyToggle}
            isActive={sammyActive}
          />
          <SammyStatus />
        </div>
      )}
    </div>
  );

  return config ? (
    <SammyAgentProvider
      guides={true} // Enable guides functionality
      guidesDebug={true} // Debug logging for guides
      guidesQueryParam="walkthrough" // Query param name for URL-based walkthroughs
      autoStartFromURL={false} // Don't auto-start, just show modal
      config={config}
    >
      {appContent}
      <SammyStartWalkthroughModal />
    </SammyAgentProvider>
  ) : appContent;
}

export default App;
