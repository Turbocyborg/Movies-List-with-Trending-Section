# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

```
# Appwrite Configuration
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id

# TMDB API Key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

## How to Find Your Appwrite Credentials

1. **Project ID**:

   - Log in to your Appwrite console: https://cloud.appwrite.io/console
   - Select your project
   - The Project ID is displayed at the top of the dashboard

2. **Database ID**:

   - In the Appwrite console, go to Databases
   - Select your database
   - The Database ID is displayed at the top of the page

3. **Collection ID**:
   - For the watchlist feature, we use a collection named 'watchlists'
   - You can leave this field empty as we're using the collection name instead of ID

## Getting a TMDB API Key

1. Create an account on The Movie Database (TMDB): https://www.themoviedb.org/signup
2. Go to your account settings
3. Click on the "API" section in the left sidebar
4. Request an API key for developer use
5. Follow the instructions to get your API key

## After Setting Up Environment Variables

1. Restart your development server:

   ```
   npm run dev
   ```

2. Run the watchlist setup script:
   ```
   npm run setup-watchlist
   ```

## Troubleshooting

If you're still experiencing issues:

1. Make sure there are no spaces around the equal signs in your .env file
2. Ensure the file is named exactly `.env` (with the dot)
3. Check that the file is in the root directory of your project
4. Restart your development server after making changes to the .env file
