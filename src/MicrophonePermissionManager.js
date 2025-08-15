/**
 * Microphone Permission Manager Component
 * Simplified component that displays a dialog for microphone permission handling
 * Uses the enhanced microphone permission hook for all logic
 */

import React from 'react';
import { useMicrophonePermission } from '@sammy-labs/sammy-three';
import './MicrophonePermissionManager.css';

export const MicrophonePermissionManager = ({
  onOpenChange,
  open,
}) => {
  const [isRequesting, setIsRequesting] = React.useState(false);

  // Enhanced hook with consolidated logic
  const {
    state,
    error,
    request,
    refresh,
    isPermissionGranted,
    isPermissionDenied,
    checkPermission,
  } = useMicrophonePermission();

  // Initialize permission check on mount
  React.useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Auto-close dialog when permission is granted
  React.useEffect(() => {
    if (isPermissionGranted && open) {
      onOpenChange(false);
    }
  }, [isPermissionGranted, open, onOpenChange]);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await request();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderPermissionContent = () => {
    if (state === 'unsupported') {
      return (
        <div className="mic-alert mic-alert-error">
          <span className="mic-alert-icon">⚠️</span>
          <div className="mic-alert-content">
            <h3>Browser Not Supported</h3>
            <p>
              Your browser doesn't support microphone access. Please use
              Chrome, Firefox, or Safari on HTTPS.
            </p>
          </div>
        </div>
      );
    }

    if (state === 'error' && error) {
      return (
        <div className="mic-alert mic-alert-error">
          <span className="mic-alert-icon">🎤</span>
          <div className="mic-alert-content">
            <h3>Microphone Error</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (isPermissionDenied) {
      return (
        <div className="mic-permission-content">
          <div className="mic-alert mic-alert-error">
            <span className="mic-alert-icon">🚫</span>
            <div className="mic-alert-content">
              <h3>Microphone Access Blocked</h3>
              <p>
                Sammy needs microphone access to work. Chrome has blocked
                microphone access for this site.
              </p>
            </div>
          </div>

          <div className="mic-instructions">
            <h4>To enable microphone access:</h4>
            <ol>
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Microphone" in the site settings</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>

          <div className="mic-button-group">
            <button
              className="mic-button mic-button-secondary"
              onClick={handleRefresh}
            >
              <span>🔄</span> Check Again
            </button>
          </div>
        </div>
      );
    }

    // Permission is in 'prompt' state
    return (
      <div className="mic-permission-content">
        <div className="mic-alert mic-alert-info">
          <span className="mic-alert-icon">🎤</span>
          <div className="mic-alert-content">
            <h3>Microphone Permission Required</h3>
            <p>
              Sammy needs access to your microphone to provide voice assistance.
              Click "Enable Microphone" to get started.
            </p>
          </div>
        </div>

        <button
          className="mic-button mic-button-primary"
          disabled={isRequesting}
          onClick={handleRequestPermission}
        >
          {isRequesting ? (
            <span className="mic-loading">Loading...</span>
          ) : (
            <>
              <span>🎤</span> Enable Microphone & Start Sammy
            </>
          )}
        </button>
      </div>
    );
  };

  if (!open) return null;

  // Render as modal dialog
  return (
    <div className="mic-modal-overlay" onClick={handleClose}>
      <div className="mic-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mic-modal-header">
          <h2>
            <span>🎤</span> Microphone Permission Required
          </h2>
          <button className="mic-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="mic-modal-body">
          {renderPermissionContent()}
        </div>

        <div className="mic-modal-footer">
          <button
            className="mic-button mic-button-outline"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
