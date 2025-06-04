import React, { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';

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

  // If searchTerm is non-empty, use the "search/movie" endpoint; otherwise, use "discover/movie"
  const fetchMovies = async (searchTerm = '') => {
    setIsLoading(true);
    setErrorMessage('');

    // Build the correct endpoint
    let endpoint;
    if (searchTerm.trim() !== '') {
      // Search by user‐typed query
      const encoded = encodeURIComponent(searchTerm.trim());
      endpoint = `${API_BASE_URL}/search/movie?query=${encoded}`;
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

      setMoviesList(data.results);
    } catch (error) {
      console.error(`Error fetching movies: ${error.message}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
      setMoviesList([]); // Clear out any old results
    } finally {
      setIsLoading(false);
    }
  };

  // Whenever the component mounts or searchTerm changes, re‐fetch
  useEffect(() => {
    fetchMovies(searchTerm);
  }, [searchTerm]);

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

        <section className="all-movies">
          <h2 className='mt-[40px]'>All Movies</h2>

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
