import React, { useEffect, useState } from 'react';
import { AgentMode, useSammyAgentContext, useMicrophonePermission } from '@sammy-labs/sammy-three';
import { MicrophonePermissionManager } from './MicrophonePermissionManager';
import './SammyGuideBubble.css';

export function SammyGuideBubble() {
  const sammyAgentContext = useSammyAgentContext();
  const { startAgent, guides } = sammyAgentContext;
  const [isHidden, setIsHidden] = useState(false);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);

  // Microphone permission hook
  const { isPermissionGranted, checkPermission } = useMicrophonePermission();

  useEffect(() => {
    // Add CSS animation keyframes
    const style = document.createElement('style');
    style.id = 'sammy-guide-animations';
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    // Only add if not already present
    if (!document.getElementById('sammy-guide-animations')) {
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup: remove the style element
      const existingStyle = document.getElementById('sammy-guide-animations');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Check microphone permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Early return if guides is null (guides disabled) or no guides context
  if (!guides) {
    return null;
  }

  const { currentGuide, isLoadingGuide, guideError } = guides;

  const handleStartWalkthrough = async () => {
    console.log(
      '[SammyGuideBubble] handleStartWalkthrough called with guide:',
      currentGuide?.guideId
    );
    if (!currentGuide) return;

    // Check if microphone permission is needed
    if (!isPermissionGranted) {
      console.log(
        '[SammyGuideBubble] Microphone permission needed, showing modal'
      );
      setShowMicPermissionModal(true);
      return;
    }

    // Start the walkthrough if permission is already granted
    await startWalkthrough();
  };

  const startWalkthrough = async () => {
    try {
      const success = await startAgent({
        agentMode: AgentMode.USER,
        guideId: currentGuide.guideId,
      });

      if (success) {
        console.log('[SammyGuideBubble] Agent started successfully');
        // Hide the bubble when walkthrough starts successfully
        setIsHidden(true);
      } else {
        console.error('[SammyGuideBubble] Failed to start walkthrough session');
      }
    } catch (error) {
      console.error('[SammyGuideBubble] Error starting walkthrough:', error);
    }
  };

  const handleMicPermissionChange = async (open) => {
    setShowMicPermissionModal(open);

    // If modal closes and permission was granted, auto-start the walkthrough
    if (!open && isPermissionGranted && currentGuide) {
      console.log(
        '[SammyGuideBubble] Permission granted, auto-starting walkthrough'
      );
      await startWalkthrough();
    }
  };

  // Show loading state while fetching guide
  if (isLoadingGuide) {
    return (
      <div className="sammy-guide-bubble sammy-guide-bubble-loading">
        <div className="sammy-guide-bubble-content">
          <div className="sammy-guide-loading">
            <div className="sammy-guide-spinner" />
            <p>Loading walkthrough...</p>
          </div>
        </div>
        <div className="sammy-guide-tail" />
      </div>
    );
  }

  // If no guide or error, don't show bubble (invalid/unauthorized)
  if (!currentGuide || guideError || isHidden) {
    return null;
  }

  return (
    <>
      <div className="sammy-guide-bubble">
        <div className="sammy-guide-bubble-content">
          {/* Rotating Orange Cube */}
          <div className="sammy-guide-cube" />

          {/* Content */}
          <div className="sammy-guide-content">
            {/* Title */}
            <h3 className="sammy-guide-title">
              {currentGuide.title || 'Interactive Walkthrough'}
            </h3>

            {/* Main text */}
            <p className="sammy-guide-description">
              Make sure to enable microphone access. I'll guide you
              through this and feel free to ask me any back and forth
              questions!
            </p>
          </div>

          {/* Start button */}
          <button
            className="sammy-guide-button"
            onClick={handleStartWalkthrough}
          >
            Begin SAMMY Walkthrough
          </button>
        </div>

        {/* Speech tail */}
        <div className="sammy-guide-tail" />
      </div>

      {/* Microphone Permission Modal */}
      <MicrophonePermissionManager
        onOpenChange={handleMicPermissionChange}
        open={showMicPermissionModal}
      />
    </>
  );
}
