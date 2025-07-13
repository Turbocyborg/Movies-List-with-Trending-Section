import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, register } = useAuth();
  
  const handleLogin = async (email, password) => {
    await signIn(email, password);
    onClose();
  };
  
  const handleSignup = async (email, password, name) => {
    await register(email, password, name);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex border-b border-gray-700">
          <button
            className={`py-2 px-4 w-1/2 text-center ${
              activeTab === 'login' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`py-2 px-4 w-1/2 text-center ${
              activeTab === 'signup' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'login' ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <SignupForm onSignup={handleSignup} />
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 