import React, { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    let endpoint;
    if (searchTerm.trim() !== '') {
      const encoded = encodeURIComponent(searchTerm.trim());
      endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encoded}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
    } else {
      endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
    }

    try {
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`Network response was not ok (status ${response.status})`);
      }

      const data = await response.json();

      if (!Array.isArray(data.results)) {
        throw new Error('Unexpected response structure from TMDB');
      }

      setMoviesList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error.message}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
      setMoviesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

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

        {trendingMovies.length > 0 && (
          <section className="trending px-4 py-8">
            <h2 className="text-4xl font-extrabold text-white drop-shadow-md mb-6">
              Trending Movies
            </h2>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <ul className="flex space-x-6 min-w-max pr-4">
                {trendingMovies.map((movie, index) => (
                  <li
                    key={movie.$id}
                    className="inline-block flex-shrink-0 w-40 text-center"
                  >
                    <p className="text-lg font-bold text-yellow-300">{index + 1}.</p>
                    <img
                      src={movie.poster_url}
                      alt={movie.searchTerm}
                      className="w-36 h-52 object-cover rounded-lg shadow-lg mx-auto"
                    />
                    <span className="text-sm text-white block mt-2">
                      {movie.searchTerm}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
