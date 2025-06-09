import React, { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY      = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [moviesList, setMoviesList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Debounce user input
  useDebounce(
    () => setDebouncedSearchTerm(searchTerm.trim()),
    500,
    [searchTerm]
  );

  // Fetch movies based on debounced search term
  const fetchMovies = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const endpoint = debouncedSearchTerm
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(debouncedSearchTerm)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

    try {
      const res = await fetch(endpoint, API_OPTIONS);
      if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.results)) throw new Error('Unexpected response');

      setMoviesList(data.results);
      if (debouncedSearchTerm && data.results.length > 0) {
        await updateSearchCount(debouncedSearchTerm, data.results[0]);
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
      setErrorMessage('Failed to fetch movies. Please try again later.');
      setMoviesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trending movies
  const loadTrendingMovies = async () => {
    try {
      const docs = await getTrendingMovies();
      setTrendingMovies(docs);
    } catch (err) {
      console.error('Load trending error:', err);
    }
  };

  // Effect: run fetchMovies when debouncedSearchTerm changes
  useEffect(() => {
    async function load() {
      await fetchMovies();
    }
    load();
  }, [debouncedSearchTerm]);

  // Effect: run loadTrendingMovies once
  useEffect(() => {
    async function load() {
      await loadTrendingMovies();
    }
    load();
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

            <div className="overflow-x-auto scroll-smooth whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-4">
              <ul className="flex space-x-6 min-w-max">
                {trendingMovies.map((movie, i) => (
                  <li
                    key={movie.$id}
                    className="inline-block flex-shrink-0 w-40 text-center"
                  >
                    <p className="text-lg font-bold text-yellow-300">{i + 1}.</p>
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
          <h2 className="text-2xl mb-4">All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {moviesList.map(m => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
