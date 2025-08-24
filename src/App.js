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
    captureMethod: process.env.REACT_APP_CAPTURE_METHOD || 'render',
    enableContextInjection: process.env.REACT_APP_ENABLE_CONTEXT !== 'false',
    enableMCP: process.env.REACT_APP_ENABLE_MCP === 'true',
    vadSensitivity: process.env.REACT_APP_VAD_SENSITIVITY || 'high',
    languageCode: process.env.REACT_APP_LANGUAGE_CODE || 'en-US',
    targetElement: process.env.REACT_APP_TARGET_ELEMENT || undefined,
    enableWorkerMode: process.env.REACT_APP_DISABLE_WORKER_MODE !== 'true',
    enableAudioAggregation: process.env.REACT_APP_ENABLE_AUDIO_AGG !== 'false',
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
            padding: '15px', 
            backgroundColor: 'rgba(0,0,0,0.3)', 
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left',
            maxWidth: '600px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}>Other Configuration:</strong>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong style={{ color: '#61dafb' }}>Core Features:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px', listStyle: 'none' }}>
                  <li>🔧 Worker Mode: {process.env.REACT_APP_DISABLE_WORKER_MODE !== 'true' ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>📊 Observability: ✅ Enabled</li>
                  <li>🎤 Audio Aggregation: {process.env.REACT_APP_ENABLE_AUDIO_AGG !== 'false' ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>📸 Capture: {process.env.REACT_APP_CAPTURE_METHOD || 'render'}</li>
                  <li>🎯 Target: {process.env.REACT_APP_TARGET_ELEMENT || 'Full Page'}</li>
                </ul>
              </div>
              
              <div>
                <strong style={{ color: '#61dafb' }}>Sammy Features:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px', listStyle: 'none' }}>
                  <li>🧠 Context Injection: {(() => {
                    const mode = process.env.REACT_APP_CONTEXT_MODE || 'full';
                    const enabled = process.env.REACT_APP_ENABLE_CONTEXT !== 'false';
                    if (!enabled) return '❌ Disabled';
                    switch(mode) {
                      case 'minimal': return '📄 Minimal';
                      case 'memory': return '🧠 Memory';
                      case 'interactive': return '👆 Interactive';
                      case 'none': return '❌ None';
                      default: return '✅ Full';
                    }
                  })()}</li>
                  <li>🔊 VAD Sensitivity: {process.env.REACT_APP_VAD_SENSITIVITY || 'low'}</li>
                  <li>🔌 MCP Protocol: {process.env.REACT_APP_ENABLE_MCP === 'true' ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>🌍 Language: {process.env.REACT_APP_LANGUAGE_CODE || 'en-US'}</li>
                  <li>🎙️ Voice: {process.env.REACT_APP_VOICE_NAME || 'aoede'}</li>
                </ul>
              </div>
            </div>
            
            {process.env.REACT_APP_ENABLE_MCP === 'true' && process.env.REACT_APP_MCP_SERVER_URL && (
              <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <strong style={{ color: '#ffd43b' }}>MCP Server:</strong>
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#aaa' }}>
                  {process.env.REACT_APP_MCP_SERVER_NAME || 'default'} - {process.env.REACT_APP_MCP_SERVER_URL?.substring(0, 50)}...
                </div>
              </div>
            )}
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
