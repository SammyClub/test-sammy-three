import React from 'react';
import { useSammyAgentContext } from '@sammy-labs/sammy-three';
import './SammyStatus.css';

const SammyStatus = () => {
  const { 
    agentStatus,
    activeSession, 
    error,
    agentVolume,
    userVolume,
    screenCapture
  } = useSammyAgentContext();
  
  // Map agentStatus to boolean states for compatibility
  const isConnected = agentStatus === 'connected';
  const isConnecting = agentStatus === 'connecting';
  const isStreaming = screenCapture?.isStreaming || false;

  const getStatusColor = () => {
    if (error) return '#ff6b6b';
    if (isConnected) return '#51cf66';
    if (isConnecting) return '#ffd43b';
    return '#868e96';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isConnected && isStreaming) return 'Active & Listening';
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div className="sammy-status">
      <div className="status-header">
        <h3>Sammy Agent Status</h3>
        <div 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor() }}
          title={getStatusText()}
        />
      </div>
      
      <div className="status-details">
        <div className="status-row">
          <span>Status:</span>
          <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
        </div>
        
        {activeSession && (
          <div className="status-row">
            <span>Session ID:</span>
            <span className="session-id">{activeSession.sessionId}...</span>
          </div>
        )}
        
        {isConnected && (
          <>
            <div className="status-row">
              <span>Streaming:</span>
              <span>{isStreaming ? '✅ Yes' : '❌ No'}</span>
            </div>
            
            <div className="status-row">
              <span>Observability:</span>
              <span>✅ Enabled</span>
            </div>
            
            {agentVolume !== undefined && (
              <div className="status-row">
                <span>Agent Volume:</span>
                <div className="volume-bar">
                  <div 
                    className="volume-fill" 
                    style={{ width: `${Math.min(agentVolume * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {userVolume !== undefined && (
              <div className="status-row">
                <span>User Volume:</span>
                <div className="volume-bar">
                  <div 
                    className="volume-fill user-volume" 
                    style={{ width: `${Math.min(userVolume * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
        
        {error && (
          <div className="status-row error">
            <span>Error:</span>
            <span>{error.message || error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SammyStatus;