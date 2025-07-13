import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { verifyDatabaseConnection, createWatchlistCollection } from '../appwrite';
import Spinner from './Spinner';

const Watchlist = () => {
  const { user } = useAuth();
  const { 
    watchlistItems, 
    loading, 
    error, 
    fetchWatchlist, 
    removeMovieFromWatchlist,
    connectionStatus,
    checkConnection
  } = useWatchlist();
  const [debugInfo, setDebugInfo] = useState(null);
  const [envVars, setEnvVars] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Check environment variables
  useEffect(() => {
    const vars = {
      DATABASE_ID_exists: !!import.meta.env.VITE_APPWRITE_DATABASE_ID,
      PROJECT_ID_exists: !!import.meta.env.VITE_APPWRITE_PROJECT_ID,
      COLLECTION_ID_exists: !!import.meta.env.VITE_APPWRITE_COLLECTION_ID,
      DATABASE_ID_length: import.meta.env.VITE_APPWRITE_DATABASE_ID?.length || 0,
      PROJECT_ID_length: import.meta.env.VITE_APPWRITE_PROJECT_ID?.length || 0,
      COLLECTION_ID_length: import.meta.env.VITE_APPWRITE_COLLECTION_ID?.length || 0,
    };
    
    setEnvVars(vars);
  }, []);

  // Log watchlist items whenever they change
  useEffect(() => {
    console.log('Watchlist component - watchlistItems:', watchlistItems);
  }, [watchlistItems]);

  // Force refresh the watchlist when component mounts or when user changes
  useEffect(() => {
    if (user) {
      console.log('Watchlist component - user detected, refreshing data');
      handleRefreshWatchlist();
      
      // Check connection status
      checkConnection();
    }
  }, [user]);

  const handleRefreshWatchlist = async () => {
    setRefreshing(true);
    try {
      await fetchWatchlist();
      window.showNotification("Watchlist refreshed successfully", "success");
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
      window.showNotification(`Failed to refresh: ${error.message}`, "error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFromWatchlist = async (docId, title) => {
    try {
      console.log(`Watchlist component - removing item with docId: ${docId}`);
      await removeMovieFromWatchlist(docId);
      window.showNotification(`"${title || 'Movie'}" removed from watchlist`, "info");
      
      // Refresh watchlist after removing
      setTimeout(() => {
        fetchWatchlist();
      }, 300);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      window.showNotification(`Failed to remove: ${error.message}`, "error");
    }
  };

  const handleCreateCollection = async () => {
    try {
      setRefreshing(true);
      const result = await createWatchlistCollection();
      if (result.success) {
        window.showNotification("Watchlist collection created successfully!", "success");
        // Refresh after creating collection
        setTimeout(() => {
          handleRefreshWatchlist();
        }, 1000);
      } else {
        window.showNotification(`Failed to create collection: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      window.showNotification(`Error: ${error.message || "Unknown error"}`, "error");
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto bg-gray-800/50 p-8 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Watchlist</h2>
          <p className="text-lg text-gray-300 mb-6">Please log in to view and manage your watchlist.</p>
          <div className="flex justify-center">
            <button 
              onClick={() => document.querySelector('button[aria-label="Login"]')?.click()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Spinner />
        <p className="mt-4 text-gray-300">Loading your watchlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-800/30 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Watchlist</h3>
          <p className="text-red-300 mb-4">{error}</p>
          
          <div className="flex flex-col gap-4 items-center mt-6">
            <button 
              onClick={handleRefreshWatchlist}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <span>⟳</span>
                  <span>Try Again</span>
                </>
              )}
            </button>
            
            <button 
              onClick={checkConnection} 
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
            >
              Check Connection
            </button>
            
            {error.includes('Collection with the requested ID could not be found') && (
              <button
                onClick={handleCreateCollection}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                Create Watchlist Collection
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-6 bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
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
          
          {connectionStatus && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Connection Status</h3>
              <div className="bg-gray-900 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className={connectionStatus.success ? "text-green-400" : "text-red-400"}>
                    {connectionStatus.success ? "✅ Connected" : "❌ Failed"}
                  </span>
                  <span className="text-white">{connectionStatus.message}</span>
                </div>
                {connectionStatus.error && (
                  <p className="text-red-400 mt-2">{connectionStatus.error}</p>
                )}
                {connectionStatus.code && (
                  <p className="text-yellow-400 mt-2">Error Code: {connectionStatus.code}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-2">Troubleshooting Steps</h3>
          <div className="bg-gray-800 p-4 rounded text-left">
            <ol className="list-decimal pl-5 space-y-2 text-white">
              <li>Check that you have a <code className="bg-gray-700 px-1 rounded">.env</code> file in your project root</li>
              <li>Verify your Appwrite credentials in the .env file:
                <pre className="bg-gray-700 p-2 rounded mt-1 text-xs">
{`VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id`}
                </pre>
              </li>
              <li>Make sure the 'watchlists' collection exists in your Appwrite database</li>
              <li>Run <code className="bg-gray-700 px-1 rounded">npm run setup-watchlist</code> to create the collection</li>
              <li>Restart your development server after making changes</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (watchlistItems.length === 0) {
    console.log('Watchlist is empty');
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto bg-gray-800/50 p-8 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Your Watchlist</h2>
          <p className="text-lg text-gray-300 mb-6">Your watchlist is empty. Start browsing and add some movies!</p>
          <div className="flex justify-center">
            <button
              onClick={() => handleRefreshWatchlist()}
              disabled={refreshing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <span>⟳</span>
                  <span>Refresh Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="watchlist px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">My Watchlist</h2>
        
        <button
          onClick={handleRefreshWatchlist}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {refreshing ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <span>⟳</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
      
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {watchlistItems.map(movie => (
          <li key={movie.$id} className="relative">
            <div className="movie-card bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="relative">
                <img 
                  src={movie.poster_url || '/no-movie.png'}
                  alt={movie.title}
                  className="w-full h-52 object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => handleRemoveFromWatchlist(movie.$id, movie.title)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
                  title="Remove from watchlist"
                >
                  ✕
                </button>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <h3 className="font-bold text-white truncate">{movie.title}</h3>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-sm text-gray-400">
                  Added on {new Date(movie.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Watchlist; 