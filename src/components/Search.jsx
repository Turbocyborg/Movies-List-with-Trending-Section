import React, { useState, useEffect, useRef } from 'react';
import { getSearchSuggestions } from '../appwrite';

const Search = ({searchTerm, setSearchTerm}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await getSearchSuggestions(searchTerm);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
  };
  
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.searchTerm);
    setShowSuggestions(false);
  };
  
  const handleFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className='search' ref={searchRef}>
      <div className='relative flex items-center bg-gray-800/80 border border-blue-500/30 rounded-lg shadow-lg hover:border-blue-500/60 transition-all group'>
        <div className="absolute left-3">
          <img src='search.svg' alt='Search Icon' className='w-6 h-6 text-white' />
        </div>

        <input
          type='text'
          placeholder='Search for a movie...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          className='w-full py-3 pl-12 pr-12 bg-transparent text-white placeholder-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg'
        />
        
        {searchTerm && (
          <button 
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.$id}
                className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.poster_url && (
                  <img 
                    src={suggestion.poster_url} 
                    alt={suggestion.searchTerm}
                    className="w-8 h-12 object-cover rounded mr-3"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/no-movie.png';
                    }}
                  />
                )}
                <div className="flex-1">
                  <p className="text-white">{suggestion.searchTerm}</p>
                  <p className="text-gray-400 text-sm">{suggestion.count} searches</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && searchTerm.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 p-4 text-center">
            <div className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            <span className="text-gray-300">Loading suggestions...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;