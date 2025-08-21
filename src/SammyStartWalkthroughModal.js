/**
 * Sammy Start Walkthrough Modal
 * Modal that automatically appears when a guide is available
 * Handles microphone permission flow seamlessly
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  useMicrophonePermission, 
  useSammyAgentContext,
  AgentMode 
} from '@sammy-labs/sammy-three';
import './SammyStartWalkthroughModal.css';

export const SammyStartWalkthroughModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasStartedWalkthrough, setHasStartedWalkthrough] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const { activeSession, startAgent, guides } = useSammyAgentContext();
  const {
    state,
    error,
    isPermissionGranted,
    isPermissionDenied,
    needsPermission,
    checkPermission,
    request,
    refresh
  } = useMicrophonePermission();

  const startWalkthroughSession = useCallback(async () => {
    try {
      setHasStartedWalkthrough(true);
      await startAgent({
        agentMode: AgentMode.USER,
        guideId: guides?.currentGuide?.guideId,
      });
      setIsModalOpen(false);
      setIsStarting(false);
    } catch (error) {
      console.error('Error starting walkthrough:', error);
      setIsStarting(false);
      // Handle error appropriately
    }
  }, [startAgent, guides?.currentGuide?.guideId]);

  // Open modal immediately when guide is available but session isn't active
  useEffect(() => {
    if (guides?.currentGuide && !activeSession && !hasStartedWalkthrough) {
      setIsModalOpen(true);
      checkPermission(); // Pre-check permission
    }
  }, [guides?.currentGuide, activeSession, hasStartedWalkthrough, checkPermission]);

  // Auto-start when permission is granted while modal is open and starting
  useEffect(() => {
    if (isPermissionGranted && isModalOpen && isStarting) {
      startWalkthroughSession();
    }
  }, [isPermissionGranted, isModalOpen, isStarting, startWalkthroughSession]);

  const handleStartWalkthrough = async () => {
    setIsStarting(true);
    
    try {
      // Step 1: Check current permission state
      const permissionResult = await checkPermission();
      
      // Step 2: If permission already granted, start immediately
      if (permissionResult.state === 'granted' || isPermissionGranted) {
        await startWalkthroughSession();
        return;
      }
      
      // Step 3: Request permission if needed
      if (permissionResult.needsPermission) {
        await request();
        // The useEffect above will handle starting when permission is granted
      }
    } catch (error) {
      console.error('Error in handleStartWalkthrough:', error);
      setIsStarting(false);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    // Re-check after refresh
    const result = await checkPermission();
    if (result.state === 'granted') {
      await startWalkthroughSession();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsStarting(false);
  };

  if (!isModalOpen || !guides?.currentGuide) return null;

  const renderModalContent = () => {
    // Starting the walkthrough (permission already granted or being processed)
    if (isStarting && (isPermissionGranted || state === 'granted')) {
      return (
        <div className="sammy-modal-auto-starting">
          <div className="sammy-modal-spinner" />
          <h3>Starting Voice Assistant...</h3>
          <p>Preparing your guided experience</p>
        </div>
      );
    }

    // Permission denied - show instructions
    if (isPermissionDenied) {
      return (
        <div className="sammy-modal-permission-denied">
          <div className="sammy-modal-icon">🚫</div>
          <h3>Microphone Access Blocked</h3>
          <p>To use the voice-guided walkthrough, you need to grant microphone access:</p>
          <ol className="sammy-modal-instructions">
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Find "Microphone" in the site settings</li>
            <li>Change from "Block" to "Allow"</li>
            <li>Click "Check Again" below</li>
          </ol>
          <div className="sammy-modal-button-group">
            <button 
              className="sammy-modal-btn sammy-modal-btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className="sammy-modal-btn sammy-modal-btn-primary"
              onClick={handleRefresh}
            >
              🔄 Check Again
            </button>
          </div>
        </div>
      );
    }

    // Error state
    if (state === 'error' && error) {
      return (
        <div className="sammy-modal-error">
          <div className="sammy-modal-icon">⚠️</div>
          <h3>Microphone Error</h3>
          <p className="sammy-modal-error-message">{error}</p>
          <div className="sammy-modal-button-group">
            <button 
              className="sammy-modal-btn sammy-modal-btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className="sammy-modal-btn sammy-modal-btn-primary"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Browser not supported
    if (state === 'unsupported') {
      return (
        <div className="sammy-modal-unsupported">
          <div className="sammy-modal-icon">⚠️</div>
          <h3>Browser Not Supported</h3>
          <p>Your browser doesn't support microphone access. Please use Chrome, Firefox, or Safari.</p>
          <div className="sammy-modal-button-group">
            <button 
              className="sammy-modal-btn sammy-modal-btn-primary"
              onClick={handleClose}
            >
              OK
            </button>
          </div>
        </div>
      );
    }

    // Default: Initial prompt to start walkthrough
    return (
      <div className="sammy-modal-initial">
        <div className="sammy-modal-icon">
          <div className="sammy-modal-speech-icon">💬</div>
        </div>
        
        <h2>Start AI Walkthrough Now?</h2>
        
        <p className="sammy-modal-description">
          Our AI assistant will walk you through the platform in real time, 
          answering your questions and guiding you step by step based on what's 
          on your screen.
        </p>

        <div className="sammy-modal-features">
          <div className="sammy-modal-feature">
            <span className="sammy-modal-feature-icon">🎯</span>
            <span>Real-time guidance through the platform</span>
          </div>
          <div className="sammy-modal-feature">
            <span className="sammy-modal-feature-icon">💬</span>
            <span>Interactive Q&A as you navigate</span>
          </div>
          <div className="sammy-modal-feature">
            <span className="sammy-modal-feature-icon">🎤</span>
            <span>Natural voice interaction</span>
          </div>
        </div>

        {needsPermission && (
          <p className="sammy-modal-permission-note">
            <span className="sammy-modal-info-icon">ℹ️</span>
            Clicking "Start Now" will request microphone access
          </p>
        )}

        <div className="sammy-modal-button-group">
          <button 
            className="sammy-modal-btn sammy-modal-btn-secondary"
            onClick={handleClose}
          >
            Not Now
          </button>
          <button 
            className="sammy-modal-btn sammy-modal-btn-primary"
            onClick={handleStartWalkthrough}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Now'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="sammy-modal-backdrop" onClick={handleClose}>
      <div className="sammy-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="sammy-modal-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div className="sammy-modal-content">
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};