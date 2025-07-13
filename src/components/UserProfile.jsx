import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <div className="flex items-center">
      <div className="mr-4">
        <p className="text-sm font-medium text-white">
          {user.name || user.email}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
      >
        Logout
      </button>
    </div>
  );
} 