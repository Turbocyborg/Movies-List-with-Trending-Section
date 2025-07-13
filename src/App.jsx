import React, { useEffect, useState, useCallback } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';
import { useAuth } from './contexts/AuthContext';
import { useWatchlist } from './contexts/WatchlistContext';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import Watchlist from './components/Watchlist';
import AppwriteDebug from './components/AppwriteDebug';
import Notification from './components/Notification';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY      = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

// Create a NotificationManager component
const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  
  // Create a global event listener for notifications
  useEffect(() => {
    const handleNotification = (event) => {
      const { message, type, duration } = event.detail;
      
      // Create a unique ID for this notification
      const id = Date.now().toString();
      
      // Add the new notification to the list
      setNotifications(prev => [...prev, { id, message, type, duration }]);
      
      // Remove the notification after it expires
      if (duration !== 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration || 5000);
      }
    };
    
    // Add event listener
    window.addEventListener('app:notification', handleNotification);
    
    // Cleanup
    return () => {
      window.removeEventListener('app:notification', handleNotification);
    };
  }, []);
  
  // Limit to showing only the most recent 3 notifications
  const visibleNotifications = notifications.slice(-3);
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-4 pointer-events-none">
      {visibleNotifications.map((notification) => (
        <div 
          key={notification.id} 
          className="pointer-events-auto"
          style={{ 
            maxWidth: '400px',
            minWidth: '300px'
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Add a global function to show notifications
window.showNotification = (message, type = 'info', duration = 5000) => {
  window.dispatchEvent(new CustomEvent('app:notification', {
    detail: { message, type, duration }
  }));
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [moviesList, setMoviesList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('movies'); // 'movies' or 'watchlist'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { user } = useAuth();
  const { fetchWatchlist } = useWatchlist();

  // Debounce user input
  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1); // Reset to first page on new search
      setMoviesList([]); // Clear existing results on new search
    },
    500,
    [searchTerm]
  );

  // Fetch movies based on debounced search term
  const fetchMovies = async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMessage('');

    const endpoint = debouncedSearchTerm
      ? `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(debouncedSearchTerm)}&page=${page}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&page=${page}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.results)) throw new Error('Unexpected response');

      if (append) {
        setMoviesList(prev => [...prev, ...data.results]);
      } else {
        setMoviesList(data.results);
      }

      setTotalPages(data.total_pages || 1);
      setCurrentPage(page);

      // Update search count in Appwrite if this is a search query and we have results
      if (page === 1 && debouncedSearchTerm && data.results.length > 0) {
        try {
          // Find the most relevant movie (first result) to associate with the search term
          const topMovie = data.results[0];
          console.log(`Updating search count for "${debouncedSearchTerm}" with movie:`, topMovie.title);
          
          // Call updateSearchCount to record this search in Appwrite
          await updateSearchCount(debouncedSearchTerm, topMovie);
          
          // Refresh trending movies after a short delay to include the new search
          setTimeout(() => {
            loadTrendingMovies();
          }, 1000);
        } catch (searchCountError) {
          console.error('Error updating search count:', searchCountError);
          // Continue with the rest of the function even if updating search count fails
        }
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
      setErrorMessage('Failed to fetch movies. Please try again later.');
      if (!append) {
        setMoviesList([]);
      }
    } finally {
      if (page === 1) {
        setIsLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more movies when user scrolls
  const handleScroll = useCallback(() => {
    if (loadingMore || currentPage >= totalPages) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      fetchMovies(currentPage + 1, true);
    }
  }, [loadingMore, currentPage, totalPages]);

  // Add scroll event listener
  useEffect(() => {
    if (activeTab === 'movies') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, activeTab]);

  // Fetch trending movies
  const loadTrendingMovies = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching trending movies...');
      const docs = await getTrendingMovies();
      console.log('Trending movies response:', docs);
      
      if (Array.isArray(docs) && docs.length > 0) {
        // Make sure we have valid data in the trending movies
        const validMovies = docs.filter(movie => 
          movie.searchTerm || movie.title || movie.movie_id
        );
        
        if (validMovies.length > 0) {
          console.log(`Found ${validMovies.length} valid trending movies`);
          setTrendingMovies(validMovies);
        } else {
          console.log('No valid trending movies found, fetching popular movies as fallback');
          await fetchFallbackTrendingMovies();
        }
      } else {
        console.log('No trending movies found, fetching popular movies as fallback');
        await fetchFallbackTrendingMovies();
      }
    } catch (err) {
      console.error('Load trending error:', err);
      // Try to fetch fallback movies on error
      try {
        await fetchFallbackTrendingMovies();
      } catch (fallbackErr) {
        console.error('Failed to fetch fallback movies:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Separate function for fetching fallback trending movies
  const fetchFallbackTrendingMovies = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch popular movies: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        throw new Error('Invalid response from TMDB API');
      }
      
      // Format the data to match our trending movies structure
      const formattedMovies = data.results.slice(0, 10).map(movie => ({
        searchTerm: movie.title,
        count: Math.floor(Math.random() * 5) + 1, // Random count between 1-5 for variety
        movie_id: movie.id,
        poster_url: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
          : '',
        title: movie.title
      }));
      
      setTrendingMovies(formattedMovies);
    } catch (error) {
      console.error('Error fetching fallback popular movies:', error);
      // Set empty array if everything fails
      setTrendingMovies([]);
    }
  };

  // Effect: run fetchMovies when debouncedSearchTerm changes
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      fetchMovies(1, false);
    }
  }, [debouncedSearchTerm]);

  // Initial load of popular movies and trending
  useEffect(() => {
    async function initialLoad() {
      await fetchMovies(1, false);
      await loadTrendingMovies();
    }
    initialLoad();
  }, []);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'watchlist' && user) {
      // Force refresh watchlist data when switching to watchlist tab
      console.log('Switching to watchlist tab - forcing refresh');
      
      // First clear any stale data
      setActiveTab('loading');
      
      // Then fetch fresh data with multiple attempts
      fetchWatchlist();
      
      // Add multiple delayed refreshes to ensure data is loaded
      setTimeout(() => {
        console.log('First delayed refresh of watchlist');
        fetchWatchlist();
        
        setTimeout(() => {
          console.log('Second delayed refresh of watchlist');
          fetchWatchlist();
          setActiveTab('watchlist');
        }, 500);
      }, 300);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        {/* Add the NotificationManager at the top level */}
        <NotificationManager />
        
        <header>
          <div className="flex justify-between items-center w-full p-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold m-0 p-0 text-left">
              <span className="text-gradient">Movies</span> App
            </h1>
            
            <div>
              {user ? (
                <UserProfile />
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
          
          <img src="./hero.jpg" alt="Hero Banner" />
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold mt-6">
            <span className="text-gradient">Movies</span> You'll Enjoy
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'movies' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => handleTabChange('movies')}
          >
            Movies
          </button>
          {user && (
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'watchlist' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleTabChange('watchlist')}
            >
              My Watchlist
            </button>
          )}
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'debug' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => handleTabChange('debug')}
          >
            Debug
          </button>
        </div>

        {/* Loading state */}
        {activeTab === 'loading' && (
          <div className="text-center py-8">
            <Spinner />
            <p className="mt-4 text-white">Loading your watchlist...</p>
          </div>
        )}

        {activeTab === 'debug' && <AppwriteDebug />}

        {activeTab === 'movies' && (
          <>
            {/* Trending Movies Section */}
            <section className="trending px-4 py-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-extrabold text-white drop-shadow-md">
                  Trending Movies
                </h2>
                
                <button
                  onClick={loadTrendingMovies}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span>⟳</span>
                  <span>Refresh Trending</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : trendingMovies.length > 0 ? (
                <div className="overflow-x-auto scroll-smooth whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-4 pb-4">
                  <ul className="flex space-x-6 min-w-max">
                    {trendingMovies.map((movie, i) => (
                      <li
                        key={`trending-${movie.movie_id || i}`}
                        className="w-48 flex-shrink-0 transition-transform hover:scale-105"
                      >
                        <div className="relative rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                          <img
                            src={movie.poster_url || '/no-movie.png'}
                            alt={movie.searchTerm || movie.title || `Trending movie ${i+1}`}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/no-movie.png';
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <h3 className="text-white font-bold truncate">
                              {movie.searchTerm || movie.title || `Trending movie ${i+1}`}
                            </h3>
                            <p className="text-gray-300 text-sm mt-1">
                              {movie.count} searches
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No trending movies available</p>
              )}
            </section>

            {/* Movie Results Section */}
            <div className="px-4">
              {debouncedSearchTerm && (
                <h2 className="text-2xl font-bold text-white mb-6">
                  Results for "{debouncedSearchTerm}"
                </h2>
              )}
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : errorMessage ? (
                <p className="text-red-500 text-center py-4">{errorMessage}</p>
              ) : moviesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {moviesList.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : debouncedSearchTerm ? (
                <p className="text-gray-400 text-center py-4">No movies found for "{debouncedSearchTerm}"</p>
              ) : null}
              
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'watchlist' && <Watchlist />}
        
        {/* Debug panel - only visible in development */}
        {import.meta.env.DEV && (
          <div className="mt-12 border-t border-gray-700 pt-8">
            <h2 className="text-xl font-bold text-white mb-4">Debug Panel</h2>
            <AppwriteDebug />
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
      />
    </main>
  );
}
