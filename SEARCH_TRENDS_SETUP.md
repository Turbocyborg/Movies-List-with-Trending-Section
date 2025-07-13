# Search Trends and Trending Movies Setup Guide

This guide will help you set up the search trends collection and fix any issues with the trending movies section in your app.

## What is the Search Trends Collection?

The search trends collection (`search_trends`) is used to:

1. Track what users are searching for in the app
2. Display trending movies based on search popularity
3. Provide search suggestions based on previous searches

## Setup Instructions

### Method 1: Using the Debug Panel (Recommended)

1. Start your app with `npm run dev`
2. Click on the "Debug" tab in the navigation
3. Click the "Create Search Trends Collection" button
4. Wait for the success message
5. Return to the Movies tab and click "Refresh Trending" to see trending movies

### Method 2: Using the Setup Script

If you prefer using the command line:

```bash
# Make sure you have your .env file set up with Appwrite credentials
npm run setup-search-trends
```

### Method 3: Manual Creation in Appwrite Console

1. Log in to your [Appwrite Console](https://cloud.appwrite.io/console)
2. Select your project and database
3. Click "Create Collection" 
4. Name it "search_trends"
5. Set permissions to allow read/write for all users
6. Add these attributes:
   - `searchTerm` (string, required)
   - `count` (integer, required)
   - `movie_id` (integer, optional)
   - `poster_url` (string, optional)
   - `title` (string, optional)

## Troubleshooting

### Trending Movies Not Showing

If your trending movies section is empty or always shows the same movies:

1. Make sure the search_trends collection exists
2. Try searching for some movies to populate the collection
3. Click the "Refresh Trending" button
4. Check browser console for any errors

If there are no search trends data, the app will automatically fall back to showing popular movies from TMDB.

### Search Activity Not Being Tracked

If your searches aren't being tracked:

1. Make sure you have proper Appwrite credentials set up
2. Check if the search_trends collection exists
3. Try using the Debug panel to verify your connection
4. Search for movies with at least 2 characters

### Appwrite Credentials Missing

If you see errors about missing credentials:

1. Go to the Debug panel
2. Click "Set Appwrite Credentials"
3. Enter your Project ID and Database ID
4. Click "Save Credentials"
5. Refresh the page

## How Search Trends Work

1. When you search for a movie, the app records your search term
2. If the same term is searched again, its count increases
3. The trending section shows movies with the highest search counts
4. If no search data exists, popular movies are shown instead

## Need More Help?

Check the browser console for detailed error messages or visit the Debug panel for more information about your Appwrite configuration. 