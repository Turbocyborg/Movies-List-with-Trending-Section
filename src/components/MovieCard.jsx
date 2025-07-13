import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../contexts/WatchlistContext';

const MovieCard = ({ movie }) => {
  const { title, vote_average, poster_path, release_date, original_language, id, overview } = movie;
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const { 
    isMovieInWatchlist, 
    addMovieToWatchlist, 
    removeMovieFromWatchlist,
    watchlistMap,
    fetchWatchlist,
    checkConnection
  } = useWatchlist();

  // Check if movie is in watchlist when component mounts or watchlistMap changes
  useEffect(() => {
    if (user) {
      checkWatchlistStatus();
    }
  }, [user, id, watchlistMap]);

  const checkWatchlistStatus = async () => {
    if (!user) return;
    
    // First check the watchlistMap for immediate response
    const movieIdStr = String(id);
    if (watchlistMap && watchlistMap[movieIdStr]) {
      console.log(`Movie ${title} (ID: ${id}) found in watchlist map`);
      setInWatchlist(true);
      setDocId(watchlistMap[movieIdStr].$id);
      return;
    }
    
    // If not in map, check with the API
    try {
      console.log(`Checking if movie ${title} (ID: ${id}) is in watchlist via API`);
      // Pass the movie ID as a number to the API
      const result = await isMovieInWatchlist(parseInt(id, 10));
      console.log(`API check result for ${title}:`, result);
      setInWatchlist(result.inWatchlist);
      setDocId(result.docId);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleWatchlist = async () => {
    if (!user) {
      window.showNotification("Please log in to add movies to your watchlist", 'info');
      return;
    }
    
    setLoading(true);
    try {
      // First check connection status
      const connectionResult = await checkConnection();
      if (!connectionResult.success) {
        console.error('Connection check failed:', connectionResult);
        window.showNotification(`Connection error: ${connectionResult.message || 'Failed to connect to database'}`, 'error');
        setLoading(false);
        return;
      }
      
      if (inWatchlist && docId) {
        console.log(`Removing movie from watchlist: ${title} (ID: ${id}, DocID: ${docId})`);
        await removeMovieFromWatchlist(docId);
        setInWatchlist(false);
        setDocId(null);
        window.showNotification(`"${title}" removed from watchlist`, 'info');
        
        // Refresh the watchlist after removing
        setTimeout(() => {
          fetchWatchlist();
        }, 300);
      } else {
        console.log(`Adding movie to watchlist: ${title} (ID: ${id})`);
        try {
          const response = await addMovieToWatchlist(movie);
          console.log('Add to watchlist response:', response);
          if (response) {
            setInWatchlist(true);
            setDocId(response.$id);
            console.log(`Movie added to watchlist with docId: ${response.$id}`);
            window.showNotification(`"${title}" added to watchlist`, 'success');
            
            // Refresh the watchlist after adding
            setTimeout(() => {
              fetchWatchlist();
            }, 300);
          } else {
            console.error('Failed to add movie to watchlist - no response');
            window.showNotification(`Failed to add "${title}" to watchlist`, 'error');
          }
        } catch (addError) {
          console.error('Error adding movie to watchlist:', addError);
          
          // Provide more detailed error messages based on error type
          let errorMessage = `Failed to add "${title}" to watchlist`;
          if (addError.message?.includes('Connection failed')) {
            errorMessage = 'Database connection failed. Please check your Appwrite configuration.';
          } else if (addError.code === 404) {
            errorMessage = 'Watchlist collection not found. Please run setup-watchlist script.';
          } else if (addError.code === 401 || addError.code === 403) {
            errorMessage = 'Authentication error. Please check your Appwrite credentials.';
          }
          
          window.showNotification(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Watchlist action error:', error);
      window.showNotification(`Error: ${error.message || 'Something went wrong'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className='movie-card group relative'>
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
        <img 
          src={poster_path 
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : '/no-movie.png'}
          alt={title}
          className="w-full rounded-lg object-cover"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          
          <div className='flex items-center space-x-2 text-sm text-gray-300 mt-1'>
            <div className='rating flex items-center'>
              <img src='star.svg' alt='Star Icon' className="w-4 h-4 mr-1"/>
              <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
            </div>
            <span>•</span>
            <p className='lang'>{original_language?.toUpperCase()}</p>
            <span>•</span>
            <p className='year'>{release_date ? release_date.split('-')[0] : 'N/A'}</p>
          </div>
          
          {overview && (
            <button 
              onClick={toggleDetails}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
        </div>
        
        {user && (
          <button
            onClick={handleWatchlist}
            disabled={loading}
            className={`absolute top-2 right-2 p-2 rounded-full ${
              inWatchlist 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white shadow-lg transition-all duration-200 hover:scale-110`}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {loading ? '...' : inWatchlist ? '✓' : '+'}
          </button>
        )}
      </div>

      {/* Movie title outside the hover state for better visibility */}
      <h3 className="font-bold text-lg text-white mt-2 truncate">{title}</h3>
      
      {/* Details panel that shows when toggled */}
      {showDetails && overview && (
        <div className="mt-2 p-3 bg-gray-800/90 rounded-lg border border-gray-700 text-sm text-gray-300">
          <p className="line-clamp-4">{overview}</p>
        </div>
      )}
    </div>
  );
};

export default MovieCard;