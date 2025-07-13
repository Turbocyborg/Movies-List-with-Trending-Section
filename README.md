# Movies List App with Authentication

A React.js application that displays movies from the TMDB API, tracks trending searches using Appwrite, and includes user authentication.

## Features

- 🎬 Browse popular movies
- 🔍 Search for movies by title
- 📊 View trending searches
- 👤 User authentication (signup, login, logout)
- 📋 Add movies to your watchlist (when logged in)
- 🔒 Secure authentication with Appwrite
- 🔄 Auto-updating trending movies based on search activity
- 💡 Search suggestions from previous searches

## Tech Stack

- React.js
- Vite
- Appwrite (Backend as a Service)
- TMDB API (The Movie Database)
- TailwindCSS for styling

## Setup Instructions

1. Clone the repository
2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:

   ```
   # Appwrite Configuration
   VITE_APPWRITE_PROJECT_ID=your-project-id
   VITE_APPWRITE_DATABASE_ID=your-database-id
   VITE_APPWRITE_COLLECTION_ID=your-collection-id  # Optional

   # TMDB API
   VITE_TMDB_API_KEY=your-tmdb-api-key
   ```

4. Appwrite Setup:

   - Create an Appwrite project
   - Create a database
   - Run the setup scripts to create required collections:
     ```
     npm run setup-watchlist
     npm run setup-search-trends
     ```
   - Or use the Debug panel in the app to create collections
   - Enable authentication in your Appwrite project settings

5. Run the development server:
   ```
   npm run dev
   ```

## Usage

- Browse movies on the homepage
- Search for movies using the search bar
- Click "Login / Sign Up" to create an account or log in
- Add movies to your watchlist by clicking the "+" button on a movie card when logged in
- View trending searches in the "Trending Movies" section
- Use the Debug panel to troubleshoot Appwrite connection issues

## Troubleshooting

If you encounter issues with collections or authentication:

1. Check the Debug panel in the app (click the "Debug" tab)
2. Verify your Appwrite credentials are correct
3. Make sure the required collections exist
4. See the detailed setup guides:
   - [Watchlist Setup Guide](./WATCHLIST_SETUP.md)
   - [Search Trends Setup Guide](./SEARCH_TRENDS_SETUP.md)
   - [Watchlist Connection Fix](./WATCHLIST_CONNECTION_FIX.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
