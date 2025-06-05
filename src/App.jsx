import React, { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';
import {Client, Databases} from 'appwrite';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [moviesList, setMoviesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [trendingMovies, setTrendingMovies] = useState([]);
  
  // Debounce the searchTerm to avoid excessive API calls(Improve Performance)
  // This will update debouncedSearchTerm after 500ms of inactivity
  // when the user types in the search input
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  // If searchTerm is non-empty, use the "search/movie" endpoint; otherwise, use "discover/movie"
  const fetchMovies = async (query='') => {
    setIsLoading(true);
    setErrorMessage('');

    // Build the correct endpoint
    let endpoint;
    if (searchTerm.trim() !== '') {
      // Search by user‐typed query
      const encoded = encodeURIComponent(searchTerm.trim());
      endpoint = query?`${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                 :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
    } else {
      // Just discover by popularity
      endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
    }

    try {
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`Network response was not ok (status ${response.status})`);
      }

      const data = await response.json();
      // TMDB returns { results: [...] } on success
      if (!Array.isArray(data.results)) {
        throw new Error('Unexpected response structure from TMDB');
      }

      setMoviesList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error.message}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
      setMoviesList([]); // Clear out any old results
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    }catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }
  
  // Whenever the component mounts or searchTerm changes, re‐fetch
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Load trending movies on initial mount
    loadTrendingMovies();
  },[])

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.jpg" alt="Hero Banner" />
          <h1>
            <span className="text-gradient">Movies</span> You'll Enjoy
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* Trending Section (only if we have at least one document) */}
        {trendingMovies.length > 0 && (
          <section className="trending px-4 py-8">
            {/* Make the heading bigger, bolder, and add bottom margin */}
            <h2 className="text-4xl font-extrabold text-white drop-shadow-md mb-8">
              Trending Movies
            </h2>

            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {trendingMovies.map((movie, index) => (
                <li
                  key={movie.$id}
                  className="flex flex-col items-center space-y-2"
                >
                  <p className="text-4xl font-bold text-white">{index + 1}.</p>
                  <img
                    src={movie.poster_url}
                    alt={movie.searchTerm}
                    className="w-36 h-52 object-cover rounded-lg shadow-lg"
                  />
                  <span className="text-base text-center text-white">
                    {movie.searchTerm}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}


        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {moviesList.map((movie) => (
                <MovieCard key= {movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
