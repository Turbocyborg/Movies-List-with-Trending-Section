# Fixing Watchlist Connection Issues

If you're seeing "Connection Failed" in the debug panel for your watchlist, this guide will help you resolve the issue.

## Step 1: Check Your Environment Variables

The most common cause of connection issues is missing or incorrect environment variables. Create a `.env` file in the root of your project with the following:

```
# Appwrite Configuration
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id

# TMDB API Key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Replace the placeholder values with your actual Appwrite credentials.

## Step 2: Get Your Appwrite Credentials

1. Log in to your Appwrite console: https://cloud.appwrite.io/console
2. Select your project
3. Copy the Project ID from the dashboard
4. Go to Databases → Your Database → Copy the Database ID
5. For the Collection ID, you can leave it as is since we're using the collection name 'watchlists'

## Step 3: Create the Watchlist Collection

Run the setup script to create the 'watchlists' collection in your Appwrite database:

```
npm run setup-watchlist
```

If you encounter any errors, make sure:
- Your .env file is correctly set up
- You have the dotenv package installed
- You are running the command from the project root directory

## Step 4: Check the Browser Console

Open your browser's developer tools (F12) and check the console for specific error messages:

- **404 errors**: The collection doesn't exist or has a different name
- **401 errors**: Authentication issues with your Appwrite credentials
- **403 errors**: Permission issues with your Appwrite project

## Step 5: Verify Collection Schema

The 'watchlists' collection should have these attributes:

- userId (string)
- movieId (integer)
- title (string)
- poster_url (string)
- createdAt (string)

If the collection exists but has a different schema, you may need to delete it and run the setup script again.

## Step 6: Check Appwrite Permissions

1. Go to your Appwrite console
2. Navigate to your project settings
3. Check that you have the correct permissions set for your collection
4. Make sure your IP address is not blocked

## Step 7: Restart Your Development Server

After making any changes, restart your development server:

```
npm run dev
```

## Step 8: Test the Connection

1. Log in to your app
2. Navigate to the Watchlist tab
3. Check the debug panel to see if the connection is successful

## Common Error Codes

- **404**: Resource not found (collection doesn't exist)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (insufficient permissions)
- **400**: Bad request (invalid data format)
- **503**: Service unavailable (Appwrite service issue)

## Still Having Issues?

If you're still experiencing connection problems, try these additional steps:

1. **Clear browser cache and cookies**
2. **Try a different browser**
3. **Check if Appwrite services are operational**
4. **Verify your internet connection**
5. **Try creating a new Appwrite project**

For further assistance, please provide the specific error message from your browser console. 