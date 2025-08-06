import React, { useState, useCallback } from 'react';
import { SammyAgentProvider as SammyAgentProviderV2, useSammyAgentContext } from '@sammy-labs/sammy-three';
import logo from './logo.svg';
import './App.css';
import SammyButton from './SammyButton';
import SammyStatus from './SammyStatus';
import { createSammyProviderConfig } from './sammyConfig';

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
  
  // Create Sammy configuration only if JWT token is available
  const config = jwtToken ? createSammyProviderConfig({
    jwtToken,
    onTokenExpired: handleTokenExpired,
    captureMethod: 'render'
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
    <SammyAgentProviderV2 config={config}>
      {appContent}
    </SammyAgentProviderV2>
  ) : appContent;
}

export default App;
