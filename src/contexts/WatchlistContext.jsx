import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, verifyDatabaseConnection, logError } from '../appwrite';

// Create context
const WatchlistContext = createContext();

// Custom hook to use the watchlist context
export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

// Provider component
export const WatchlistProvider = ({ children }) => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistMap, setWatchlistMap] = useState({});  // Map for O(1) lookups
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { user } = useAuth();

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Update the map whenever watchlist items change
  useEffect(() => {
    const newMap = {};
    watchlistItems.forEach(item => {
      // Use the movieId as a string for the map key
      const movieIdStr = String(item.movieId);
      newMap[movieIdStr] = item;
    });
    setWatchlistMap(newMap);
    console.log('Updated watchlistMap:', newMap);
    console.log('Current watchlistItems:', watchlistItems);
  }, [watchlistItems]);

  // Load watchlist when user changes
  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setWatchlistItems([]);
      setWatchlistMap({});
    }
  }, [user]);

  // Check database connection
  const checkConnection = useCallback(async () => {
    try {
      const result = await verifyDatabaseConnection();
      setConnectionStatus(result);
      console.log('Connection status:', result);
      
      if (!result.success) {
        setError(`Connection issue: ${result.message}`);
      } else if (error && error.includes('Connection issue')) {
        // Clear connection-related errors if connection is now successful
        setError(null);
      }
      
      return result;
    } catch (err) {
      console.error('Connection check error:', err);
      setConnectionStatus({
        success: false,
        message: 'Failed to check connection',
        error: err.message
      });
      setError('Failed to connect to database');
      return {
        success: false,
        error: err.message
      };
    }
  }, [error]);

  // Fetch the user's watchlist with retry logic
  const fetchWatchlist = useCallback(async (retryCount = 0) => {
    if (!user) return;

    try {
      console.log(`Fetching watchlist for user: ${user.$id}`);
      setLoading(true);
      setError(null);
      
      // Check connection first
      const connectionResult = await checkConnection();
      if (!connectionResult.success) {
        setError(`Cannot fetch watchlist: ${connectionResult.message || 'Connection failed'}`);
        return;
      }
      
      // Force clear the watchlist first to avoid stale data
      setWatchlistItems([]);
      
      const items = await getWatchlist(user.$id);
      console.log('Watchlist loaded, items count:', items.length);
      console.log('Watchlist items:', items);
      
      // Only update if we actually got items back
      if (Array.isArray(items)) {
        setWatchlistItems(items);
        setLastRefresh(new Date());
      } else {
        console.error('Invalid watchlist data returned:', items);
        setWatchlistItems([]);
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError(`Failed to load watchlist: ${err.message}`);
      
      // Implement retry logic for transient errors
      if (retryCount < 2) {
        console.log(`Retrying watchlist fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          fetchWatchlist(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        setWatchlistItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, checkConnection]);

  // Check if a movie is in the watchlist
  const isMovieInWatchlist = useCallback(async (movieId) => {
    if (!user) return { inWatchlist: false, docId: null };

    // First check the local map for O(1) lookup
    const movieIdStr = String(movieId);
    if (watchlistMap[movieIdStr]) {
      return { 
        inWatchlist: true, 
        docId: watchlistMap[movieIdStr].$id 
      };
    }

    // If not found locally, check the database
    try {
      const result = await isInWatchlist(user.$id, movieId);
      return { inWatchlist: !!result, docId: result?.$id };
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return { inWatchlist: false, docId: null };
    }
  }, [user, watchlistMap]);

  // Add a movie to the watchlist
  const addMovieToWatchlist = useCallback(async (movie) => {
    if (!user) return null;

    try {
      // Check connection first
      const connectionResult = await checkConnection();
      if (!connectionResult.success) {
        console.error('Cannot add to watchlist - connection failed:', connectionResult);
        throw new Error(`Connection failed: ${connectionResult.message || 'Unknown error'}`);
      }
      
      console.log(`Adding movie to watchlist: ${movie.title} (ID: ${movie.id})`);
      setLoading(true);
      const response = await addToWatchlist(user.$id, movie);
      console.log('Appwrite response for add to watchlist:', response);
      
      if (!response) {
        console.error('No response from addToWatchlist');
        throw new Error('Failed to add to watchlist - no response from server');
      }
      
      // Update local state with a fresh copy to avoid reference issues
      setWatchlistItems(prev => {
        // Check if movie already exists in the list
        const exists = prev.some(item => item.movieId === parseInt(movie.id, 10));
        console.log(`Movie already exists in watchlist: ${exists}`);
        if (!exists) {
          console.log('Adding movie to local state');
          const newItems = [...prev, {...response}];
          console.log('New watchlist items:', newItems);
          return newItems;
        }
        return prev;
      });
      
      // Update last refresh timestamp
      setLastRefresh(new Date());
      
      return response;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      const formattedError = logError(error);
      throw formattedError;
    } finally {
      setLoading(false);
    }
  }, [user, checkConnection]);

  // Remove a movie from the watchlist
  const removeMovieFromWatchlist = useCallback(async (docId) => {
    if (!user || !docId) return false;

    try {
      setLoading(true);
      await removeFromWatchlist(docId);
      
      // Update local state
      setWatchlistItems(prev => prev.filter(item => item.$id !== docId));
      
      // Update last refresh timestamp
      setLastRefresh(new Date());
      
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      const formattedError = logError(error);
      throw formattedError;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Force refresh the watchlist
  const forceRefresh = useCallback(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user, fetchWatchlist]);

  const value = {
    watchlistItems,
    watchlistMap,
    loading,
    error,
    connectionStatus,
    lastRefresh,
    fetchWatchlist,
    checkConnection,
    isMovieInWatchlist,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    forceRefresh
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}; 