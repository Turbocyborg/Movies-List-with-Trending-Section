import { Client, Databases, ID } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// This script checks if the search_trends collection exists and creates it if it doesn't
// Run this script with: node -r dotenv/config src/createSearchTrendsCollection.js

// Get environment variables
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;

// Log environment variables (without revealing sensitive info)
console.log("Environment variables check:", {
  DATABASE_ID_exists: !!DATABASE_ID,
  PROJECT_ID_exists: !!PROJECT_ID,
  DATABASE_ID_length: DATABASE_ID?.length || 0,
  PROJECT_ID_length: PROJECT_ID?.length || 0
});

// Collection name
const SEARCH_TRENDS_COLLECTION_NAME = 'search_trends';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const databases = new Databases(client);

async function createSearchTrendsCollection() {
    try {
        if (!DATABASE_ID || !PROJECT_ID) {
            console.error('Error: Missing required environment variables. Please check your .env file.');
            console.log('Required variables:');
            console.log('- VITE_APPWRITE_DATABASE_ID');
            console.log('- VITE_APPWRITE_PROJECT_ID');
            process.exit(1);
        }

        console.log('Checking if search_trends collection exists...');
        
        try {
            // Try to get documents from the search_trends collection
            await databases.listDocuments(DATABASE_ID, SEARCH_TRENDS_COLLECTION_NAME, []);
            console.log('Search trends collection already exists');
        } catch (error) {
            // If collection doesn't exist, create it
            if (error.code === 404) {
                console.log('Search trends collection does not exist, creating it...');
                
                try {
                    // Check if we have the createCollection method (newer SDK versions)
                    if (typeof databases.createCollection === 'function') {
                        // Create the collection using the newer API
                        const collection = await databases.createCollection(
                            DATABASE_ID,
                            ID.unique(),
                            SEARCH_TRENDS_COLLECTION_NAME,
                            ['*'], // Read permissions for all users
                            ['*']  // Write permissions for all users
                        );
                        
                        console.log('Collection created:', collection);
                        
                        // Create required attributes
                        await databases.createStringAttribute(
                            DATABASE_ID,
                            collection.$id,
                            'searchTerm',
                            255,
                            true, // required
                            '', // default value
                            false // not array
                        );
                        
                        await databases.createIntegerAttribute(
                            DATABASE_ID,
                            collection.$id,
                            'count',
                            true, // required
                            1, // default value
                            false // not array
                        );
                        
                        await databases.createIntegerAttribute(
                            DATABASE_ID,
                            collection.$id,
                            'movie_id',
                            false, // not required
                            0, // default value
                            false // not array
                        );
                        
                        await databases.createStringAttribute(
                            DATABASE_ID,
                            collection.$id,
                            'poster_url',
                            1024,
                            false, // not required
                            '', // default value
                            false // not array
                        );
                        
                        await databases.createStringAttribute(
                            DATABASE_ID,
                            collection.$id,
                            'title',
                            255,
                            false, // not required
                            '', // default value
                            false // not array
                        );
                        
                        console.log('Search trends collection setup complete');
                    } else {
                        // For older SDK versions that don't have createCollection
                        console.log('Using alternative method for older Appwrite SDK...');
                        console.log('Please create the collection manually in the Appwrite console with these attributes:');
                        console.log('- searchTerm (string, required)');
                        console.log('- count (integer, required)');
                        console.log('- movie_id (integer, optional)');
                        console.log('- poster_url (string, optional)');
                        console.log('- title (string, optional)');
                        
                        console.log('\nOr use the Debug panel in the app to create the collection.');
                    }
                } catch (createError) {
                    console.error('Error creating collection:', createError);
                    console.log('\nPlease create the collection manually in the Appwrite console with these attributes:');
                    console.log('- searchTerm (string, required)');
                    console.log('- count (integer, required)');
                    console.log('- movie_id (integer, optional)');
                    console.log('- poster_url (string, optional)');
                    console.log('- title (string, optional)');
                    
                    console.log('\nOr use the Debug panel in the app to create the collection.');
                }
            } else {
                console.error('Error checking collection:', error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

createSearchTrendsCollection().then(() => {
    console.log('Script completed');
}); 