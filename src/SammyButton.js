import React, { useState } from 'react';
import { useSammyAgentContext, AgentMode } from '@sammy-labs/sammy-three';
import './SammyButton.css';

const SammyButton = ({ onToggle, isActive = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { startAgent, stopAgent, agentStatus } = useSammyAgentContext();

  // Use agentStatus to determine if agent is actually active
  const isAgentActive = agentStatus === 'connected' || agentStatus === 'connecting';

  const handleClick = async () => {
    try {
      if (isAgentActive) {
        stopAgent();
        console.log('Sammy agent stopped');
      } else {
        // Get guide ID from environment variable if available
        const guideId = process.env.REACT_APP_GUIDE_ID || null;
        
        // Prepare start options
        const startOptions = {
          agentMode: AgentMode.USER, // Default to USER mode
        };
        
        // Add guide ID if available
        if (guideId) {
          startOptions.guideId = guideId;
          console.log('Starting Sammy agent with guide:', guideId);
        }
        
        await startAgent(startOptions);
        console.log('Sammy agent started', startOptions);
      }
      if (onToggle) {
        onToggle(!isAgentActive);
      }
    } catch (error) {
      console.error('Error toggling Sammy agent:', error);
    }
  };

  return (
    <button
      className={`sammy-button ${isAgentActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isAgentActive ? 'Stop Sammy Agent' : 'Start Sammy Agent'}
      aria-label={isAgentActive ? 'Stop Sammy Agent' : 'Start Sammy Agent'}
    >
      <div className="sammy-icon">
        {isAgentActive ? (
          // Stop icon
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
          </svg>
        ) : (
          // Sammy/AI icon
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
        )}
      </div>
      {isAgentActive && <div className="pulse-ring"></div>}
    </button>
  );
};

export default SammyButton;