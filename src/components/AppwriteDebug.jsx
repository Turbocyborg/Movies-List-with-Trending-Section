import React, { useState, useEffect } from 'react';
import { verifyDatabaseConnection, createWatchlistCollection } from '../appwrite';
import Notification from './Notification';

// Import the function to create search trends collection
const createSearchTrendsCollection = async () => {
  // Dynamically import to avoid bundling Node.js code
  try {
    const { default: createCollection } = await import('../createSearchTrendsCollection');
    return createCollection();
  } catch (error) {
    console.error("Error importing search trends creation script:", error);
    
    // Fallback implementation if import fails
    const { Client, Databases, ID } = await import('appwrite');
    
    // Get credentials from localStorage or environment
    const getProjectId = () => {
      return import.meta.env.VITE_APPWRITE_PROJECT_ID || 
             localStorage.getItem('APPWRITE_PROJECT_ID') || 
             '';
    };

    const getDatabaseId = () => {
      return import.meta.env.VITE_APPWRITE_DATABASE_ID || 
             localStorage.getItem('APPWRITE_DATABASE_ID') || 
             '';
    };
    
    const PROJECT_ID = getProjectId();
    const DATABASE_ID = getDatabaseId();
    const SEARCH_TRENDS_COLLECTION_NAME = 'search_trends';
    
    const client = new Client()
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject(PROJECT_ID);

    const databases = new Databases(client);
    
    try {
      // Create the collection
      const collection = await databases.createCollection(
        DATABASE_ID,
        ID.unique(),
        SEARCH_TRENDS_COLLECTION_NAME,
        ['*'], // Read permissions
        ['*']  // Write permissions
      );
      
      // Create attributes
      await databases.createStringAttribute(
        DATABASE_ID,
        collection.$id,
        'searchTerm',
        255,
        true,
        '',
        false
      );
      
      await databases.createIntegerAttribute(
        DATABASE_ID,
        collection.$id,
        'count',
        true,
        1,
        false
      );
      
      await databases.createIntegerAttribute(
        DATABASE_ID,
        collection.$id,
        'movie_id',
        false,
        0,
        false
      );
      
      await databases.createStringAttribute(
        DATABASE_ID,
        collection.$id,
        'poster_url',
        1024,
        false,
        '',
        false
      );
      
      await databases.createStringAttribute(
        DATABASE_ID,
        collection.$id,
        'title',
        255,
        false,
        '',
        false
      );
      
      return { success: true };
    } catch (err) {
      console.error("Error creating search trends collection:", err);
      return { success: false, error: err.message };
    }
  }
};

const AppwriteDebug = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [envVars, setEnvVars] = useState({});
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [creatingSearchTrends, setCreatingSearchTrends] = useState(false);
  const [showEnvForm, setShowEnvForm] = useState(false);
  const [credentials, setCredentials] = useState({
    projectId: '',
    databaseId: '',
    collectionId: ''
  });
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Check environment variables
    const vars = {
      DATABASE_ID_exists: !!import.meta.env.VITE_APPWRITE_DATABASE_ID,
      PROJECT_ID_exists: !!import.meta.env.VITE_APPWRITE_PROJECT_ID,
      COLLECTION_ID_exists: !!import.meta.env.VITE_APPWRITE_COLLECTION_ID,
      DATABASE_ID_length: import.meta.env.VITE_APPWRITE_DATABASE_ID?.length || 0,
      PROJECT_ID_length: import.meta.env.VITE_APPWRITE_PROJECT_ID?.length || 0,
      COLLECTION_ID_length: import.meta.env.VITE_APPWRITE_COLLECTION_ID?.length || 0,
    };
    
    setEnvVars(vars);
    
    // Pre-fill form with any existing env vars
    setCredentials({
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
      databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
      collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID || ''
    });
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const connectionResult = await verifyDatabaseConnection();
      setResult(connectionResult);
    } catch (err) {
      console.error("Connection check failed:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    setCreatingCollection(true);
    try {
      const result = await createWatchlistCollection();
      
      if (result.success) {
        window.showNotification("Watchlist collection created successfully!", "success");
        // Refresh connection status after creating collection
        setTimeout(() => {
          checkConnection();
        }, 1000);
      } else if (result.code === 'SDK_VERSION_ERROR') {
        // Show manual collection creation instructions for older SDK versions
        setShowManualInstructions(true);
        window.showNotification("Your Appwrite SDK version doesn't support automatic collection creation. Please follow the manual instructions.", "warning");
      } else {
        window.showNotification(`Failed to create collection: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      window.showNotification(`Error: ${error.message || "Unknown error"}`, "error");
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleCreateSearchTrendsCollection = async () => {
    setCreatingSearchTrends(true);
    try {
      const result = await createSearchTrendsCollection();
      
      if (result?.success) {
        window.showNotification("Search trends collection created successfully!", "success");
        // Refresh connection status after creating collection
        setTimeout(() => {
          checkConnection();
        }, 1000);
      } else {
        window.showNotification(`Failed to create search trends collection: ${result?.error || 'Unknown error'}`, "error");
      }
    } catch (error) {
      console.error("Error creating search trends collection:", error);
      window.showNotification(`Error: ${error.message || "Unknown error"}`, "error");
    } finally {
      setCreatingSearchTrends(false);
    }
  };
  
  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveCredentials = () => {
    // Store credentials in localStorage
    if (credentials.projectId) {
      localStorage.setItem('APPWRITE_PROJECT_ID', credentials.projectId);
    }
    if (credentials.databaseId) {
      localStorage.setItem('APPWRITE_DATABASE_ID', credentials.databaseId);
    }
    if (credentials.collectionId) {
      localStorage.setItem('APPWRITE_COLLECTION_ID', credentials.collectionId);
    }
    
    // Show notification
    window.showNotification("Credentials saved! Please refresh the page to apply changes.", "success");
    
    // Close the form
    setShowEnvForm(false);
    
    // Reload the page after a short delay to apply new credentials
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto my-8">
      <h2 className="text-xl font-bold text-white mb-4">Appwrite Configuration Debug</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Environment Variables</h3>
        <div className="bg-gray-900 p-4 rounded">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 border-b border-gray-700">
              <span className="text-gray-300">{key}</span>
              <span className={value ? "text-green-400" : "text-red-400"}>
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
              </span>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowEnvForm(!showEnvForm)}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded w-full"
        >
          {showEnvForm ? 'Hide Credential Form' : 'Set Appwrite Credentials'}
        </button>
        
        {showEnvForm && (
          <div className="mt-4 bg-gray-900 p-4 rounded">
            <p className="text-yellow-300 mb-4 text-sm">
              These credentials will be stored in your browser's localStorage. 
              Refresh the page after saving to apply changes.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Project ID</label>
              <input
                type="text"
                name="projectId"
                value={credentials.projectId}
                onChange={handleCredentialChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                placeholder="Your Appwrite Project ID"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Database ID</label>
              <input
                type="text"
                name="databaseId"
                value={credentials.databaseId}
                onChange={handleCredentialChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                placeholder="Your Appwrite Database ID"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Collection ID (optional)</label>
              <input
                type="text"
                name="collectionId"
                value={credentials.collectionId}
                onChange={handleCredentialChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                placeholder="Your Appwrite Collection ID (optional)"
              />
            </div>
            
            <button
              onClick={handleSaveCredentials}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full"
            >
              Save Credentials
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Connection Test</h3>
        {loading ? (
          <p className="text-blue-300">Testing connection...</p>
        ) : error ? (
          <div className="bg-red-900/30 p-4 rounded">
            <p className="text-red-400">Error: {error}</p>
          </div>
        ) : result ? (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className={result.success ? "text-green-400" : "text-red-400"}>
                {result.success ? "✅ Connected" : "❌ Failed"}
              </span>
              <span className="text-white">{result.message}</span>
            </div>
            {result.error && (
              <p className="text-red-400 mt-2">{result.error}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-400">No results yet</p>
        )}
      </div>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={checkConnection}
          className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Test Connection
        </button>
        
        {result && !result.success && result.error && result.error.includes('Collection with the requested ID could not be found') && (
          <button 
            onClick={handleCreateCollection}
            disabled={creatingCollection}
            className="py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-2"
          >
            {creatingCollection ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Creating Collection...</span>
              </>
            ) : (
              'Create Watchlist Collection'
            )}
          </button>
        )}
        
        {/* Add button for creating search trends collection */}
        <button 
          onClick={handleCreateSearchTrendsCollection}
          disabled={creatingSearchTrends}
          className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center gap-2"
        >
          {creatingSearchTrends ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Creating Search Trends Collection...</span>
            </>
          ) : (
            'Create Search Trends Collection'
          )}
        </button>
      </div>
      
      <div className="mt-6 bg-gray-900 p-4 rounded text-left">
        <h3 className="text-lg font-semibold text-white mb-2">How to Find Your Credentials</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-300 text-sm">
          <li>Log in to your <a href="https://cloud.appwrite.io/console" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Appwrite Console</a></li>
          <li>Select your project (or create a new one)</li>
          <li>The Project ID is displayed at the top of the dashboard</li>
          <li>Go to Databases and select your database (or create a new one)</li>
          <li>The Database ID is displayed at the top of the database page</li>
        </ol>
      </div>
      
      {showManualInstructions && (
        <div className="mt-6 bg-yellow-900/30 p-4 rounded">
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">Manual Collection Setup</h3>
          <p className="text-yellow-200 mb-4">Your Appwrite SDK version doesn't support automatic collection creation. Please follow these steps:</p>
          
          <ol className="list-decimal pl-5 space-y-2 text-gray-300 text-sm">
            <li>Log in to your <a href="https://cloud.appwrite.io/console" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Appwrite Console</a></li>
            <li>Select your project and database</li>
            <li>Click "Create Collection" and name it "watchlists"</li>
            <li>Set permissions to allow read/write for all users</li>
            <li>Add these attributes:
              <ul className="list-disc pl-5 mt-1">
                <li>userId (string, required)</li>
                <li>movieId (integer, required)</li>
                <li>title (string, required)</li>
                <li>poster_url (string, optional)</li>
                <li>createdAt (string, required)</li>
              </ul>
            </li>
            <li>Click "Create Collection" and name it "search_trends"</li>
            <li>Set permissions to allow read/write for all users</li>
            <li>Add these attributes:
              <ul className="list-disc pl-5 mt-1">
                <li>searchTerm (string, required)</li>
                <li>count (integer, required)</li>
                <li>movie_id (integer, optional)</li>
                <li>poster_url (string, optional)</li>
                <li>title (string, optional)</li>
              </ul>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default AppwriteDebug; 