import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState(null);

  // Set up auto-dismiss timer
  useEffect(() => {
    if (duration && visible) {
      // Set up progress bar
      const steps = 100;
      const stepDuration = duration / steps;
      const id = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(id);
            return 0;
          }
          return prev - 100 / steps;
        });
      }, stepDuration);
      
      setIntervalId(id);
      
      // Set timeout to hide notification
      const timeout = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearInterval(id);
        clearTimeout(timeout);
      };
    }
  }, [duration, visible]);

  const handleClose = () => {
    setVisible(false);
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  // Define styles based on notification type
  const typeStyles = {
    success: {
      bg: 'bg-green-600',
      border: 'border-green-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      )
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-500',
      border: 'border-yellow-600',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full md:w-96 animate-slide-in-right shadow-2xl">
      <div className={`${style.bg} ${style.border} border-2 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm bg-opacity-95`}>
        <div className="flex items-start p-4">
          <div className="flex-shrink-0">
            {style.icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-base font-medium text-white">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-white focus:outline-none focus:text-gray-200 hover:bg-black/20 p-1.5 rounded-full transition-colors"
              onClick={handleClose}
              aria-label="Close notification"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div 
          className={`h-1 ${style.bg} transition-all duration-100 ease-linear`} 
          style={{ width: `${progress}%`, filter: 'brightness(1.2)' }} 
        />
      </div>
    </div>
  );
};

export default Notification; 