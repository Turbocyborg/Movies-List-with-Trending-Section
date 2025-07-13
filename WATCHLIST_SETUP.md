# Watchlist Setup Guide

## Issue: Connection Failed in Debug Panel

If you're seeing "Connection Failed" in the debug panel for your watchlist, follow these steps to fix it:

## 1. Check Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
# Appwrite Configuration
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id

# TMDB API Key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Replace the placeholder values with your actual Appwrite credentials.

## 2. Create the Watchlist Collection

Run the setup script to create the watchlist collection:

```
npm run setup-watchlist
```

This will create the 'watchlists' collection in your Appwrite database with the correct schema.

## 3. Verify Appwrite Configuration

1. Log in to your Appwrite console: https://cloud.appwrite.io/console
2. Check that your project exists and note the Project ID
3. Navigate to Databases and check that your database exists and note the Database ID
4. Ensure that a collection named 'watchlists' exists in your database

## 4. Update Environment Variables

Make sure your `.env` file has the correct values:

```
VITE_APPWRITE_PROJECT_ID=<your actual project ID>
VITE_APPWRITE_DATABASE_ID=<your actual database ID>
```

## 5. Restart Development Server

After updating the environment variables, restart your development server:

```
npm run dev
```

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify that your Appwrite project has the correct permissions set up
3. Make sure your IP address is allowed in Appwrite's platform settings
4. Check that the 'watchlists' collection has the correct attributes:
   - userId (string)
   - movieId (integer)
   - title (string)
   - poster_url (string)
   - createdAt (string)

## Need More Help?

If you continue to experience issues, please provide the specific error message from the browser console for more targeted assistance.
