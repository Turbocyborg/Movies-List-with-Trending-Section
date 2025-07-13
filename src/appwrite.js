import { Client, Databases, ID, Query, Account } from 'appwrite';

// Get credentials from environment variables or localStorage
const getProjectId = () => {
    return import.meta.env.VITE_APPWRITE_PROJECT_ID || 
           localStorage.getItem('APPWRITE_PROJECT_ID') || 
           '';
};

const getDatabaseId = () => {
    return import.meta.env.VITE_APPWRITE_DATABASE_ID || 
           localStorage.getItem('APPWRITE_DATABASE_ID') || 
           '';
};

const getCollectionId = () => {
    return import.meta.env.VITE_APPWRITE_COLLECTION_ID || 
           localStorage.getItem('APPWRITE_COLLECTION_ID') || 
           '';
};

// Log environment variables (without revealing sensitive info)
console.log("Credentials check:", {
  DATABASE_ID_exists: !!getDatabaseId(),
  PROJECT_ID_exists: !!getProjectId(),
  COLLECTION_ID_exists: !!getCollectionId(),
  DATABASE_ID_length: getDatabaseId()?.length || 0,
  PROJECT_ID_length: getProjectId()?.length || 0,
  COLLECTION_ID_length: getCollectionId()?.length || 0
});

const DATABASE_ID = getDatabaseId();
const PROJECT_ID = getProjectId();
const COLLECTION_ID = getCollectionId();
// Define collection names
const WATCHLIST_COLLECTION_NAME = 'watchlists';
const SEARCH_TRENDS_COLLECTION_NAME = 'search_trends';

console.log("Using watchlist collection name:", WATCHLIST_COLLECTION_NAME);
console.log("Using search trends collection name:", SEARCH_TRENDS_COLLECTION_NAME);

// Check for missing credentials
if (!PROJECT_ID) {
  console.error("CRITICAL ERROR: Missing PROJECT_ID. Please set it in .env file or use the Debug panel.");
}

if (!DATABASE_ID) {
  console.error("CRITICAL ERROR: Missing DATABASE_ID. Please set it in .env file or use the Debug panel.");
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

// Authentication functions
export const createAccount = async (email, password, name) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (newAccount) {
            return await login(email, password);
        }
    } catch (error) {
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        return await account.createEmailPasswordSession(email, password);
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

export const logout = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error) {
        console.error("Error during logout:", error);
        throw error;
    }
};

export const updateSearchCount = async (searchTerm, movie) => {
    try {
        if (!searchTerm || !movie) {
            console.error('Missing searchTerm or movie data for updateSearchCount');
            return;
        }

        const cleanSearchTerm = searchTerm.trim().toLowerCase();
        
        // Skip very short search terms
        if (cleanSearchTerm.length < 2) {
            console.log('Search term too short, skipping search count update');
            return;
        }
        
        // Skip if database or collection is not configured
        if (!DATABASE_ID || !PROJECT_ID) {
            console.error('Missing DATABASE_ID or PROJECT_ID for updateSearchCount');
            return;
        }
        
        console.log(`Updating search count for term: "${cleanSearchTerm}"`);
        
        // Try to find existing search term in search_trends collection
        try {
            const result = await databases.listDocuments(
                DATABASE_ID,
                SEARCH_TRENDS_COLLECTION_NAME,
                [Query.equal('searchTerm', cleanSearchTerm)]
            );

            if (result.total > 0 && result.documents.length > 0) {
                // Update existing search term count
                const doc = result.documents[0];
                console.log(`Found existing search term, updating count from ${doc.count} to ${doc.count + 1}`);

                await databases.updateDocument(
                    DATABASE_ID,
                    SEARCH_TRENDS_COLLECTION_NAME,
                    doc.$id,
                    {
                        count: doc.count + 1,
                        // Update poster URL and movie_id if they were empty before
                        ...((!doc.poster_url && movie.poster_path) ? {
                            poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                        } : {}),
                        ...((!doc.movie_id) ? { movie_id: movie.id } : {})
                    }
                );
            } else {
                // Create new search term entry
                console.log(`Creating new search term entry for "${cleanSearchTerm}"`);
                const newDocument = {
                    searchTerm: cleanSearchTerm,
                    count: 1,
                    movie_id: movie.id,
                    title: movie.title || '',
                    poster_url: movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                        : ''
                };

                await databases.createDocument(
                    DATABASE_ID,
                    SEARCH_TRENDS_COLLECTION_NAME,
                    ID.unique(),
                    newDocument
                );
            }
            
            console.log(`Successfully updated search count for "${cleanSearchTerm}"`);
        } catch (error) {
            // Check if it's a "collection not found" error
            if (error.code === 404) {
                console.error('Search trends collection not found. Please create it first.');
                console.log('You can create it from the Debug panel in the app.');
            } else {
                console.error('Error updating search count:', error);
            }
        }
    } catch (error) {
        console.error('Error in updateSearchCount:', error);
    }
};

export const getTrendingMovies = async () => {
    try {
        // Skip if database or collection is not configured
        if (!DATABASE_ID || !PROJECT_ID) {
            console.error('Missing DATABASE_ID or PROJECT_ID for getTrendingMovies');
            return [];
        }
        
        console.log('Fetching trending movies from search_trends collection');
        
        try {
            const result = await databases.listDocuments(
                DATABASE_ID,
                SEARCH_TRENDS_COLLECTION_NAME,
                [
                    Query.orderDesc('count'),
                    Query.limit(10)
                ]
            );

            console.log(`Found ${result.documents?.length || 0} trending movies`);
            
            // Validate the documents
            const validDocuments = result.documents?.filter(doc => 
                doc.searchTerm && doc.count && (doc.movie_id || doc.poster_url)
            ) || [];
            
            if (validDocuments.length < result.documents?.length) {
                console.log(`Filtered out ${result.documents?.length - validDocuments.length} invalid documents`);
            }
            
            return validDocuments;
        } catch (error) {
            // Check if it's a "collection not found" error
            if (error.code === 404) {
                console.error('Search trends collection not found. Please create it first.');
                console.log('You can create it from the Debug panel in the app.');
            } else {
                console.error('Error fetching trending movies:', error);
            }
            return [];
        }
    } catch (error) {
        console.error('Error in getTrendingMovies:', error);
        return [];
    }
};

export const getSearchSuggestions = async (searchTerm) => {
    try {
        if (!searchTerm || searchTerm.length < 2) {
            return [];
        }
        
        const cleanTerm = searchTerm.trim().toLowerCase();
        console.log(`Getting search suggestions for: "${cleanTerm}"`);
        
        // Find terms that start with the search input
        const result = await databases.listDocuments(
            DATABASE_ID,
            SEARCH_TRENDS_COLLECTION_NAME,
            [
                Query.startsWith('searchTerm', cleanTerm),
                Query.orderDesc('count'),
                Query.limit(5)
            ]
        );
        
        console.log(`Found ${result.documents?.length || 0} search suggestions`);
        return result.documents || [];
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
    }
};

// Create a watchlists collection if it doesn't exist when the app starts
const ensureCollections = async () => {
    try {
        // Check for watchlist collection
        try {
            await databases.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_NAME, [Query.limit(1)]);
            console.log('Watchlist collection exists');
        } catch (error) {
            console.error('Watchlist collection might not exist:', error);
            console.log('Please run: npm run setup-watchlist');
        }
        
        // Check for search_trends collection
        try {
            await databases.listDocuments(DATABASE_ID, SEARCH_TRENDS_COLLECTION_NAME, [Query.limit(1)]);
            console.log('Search trends collection exists');
        } catch (error) {
            console.error('Search trends collection might not exist:', error);
            console.log('Please run: npm run setup-search-trends');
        }
    } catch (error) {
        console.error('Error checking collections:', error);
    }
};

// Expose a function to manually create the watchlist collection
export const createWatchlistCollection = async () => {
    try {
        console.log('Manually creating watchlist collection...');
        
        // Check if the createCollection method exists
        if (typeof databases.createCollection !== 'function') {
            console.error('Your Appwrite SDK version does not support createCollection');
            return { 
                success: false, 
                error: 'Your Appwrite SDK version does not support collection creation. Please upgrade to a newer version or create the collection manually in the Appwrite console.',
                code: 'SDK_VERSION_ERROR'
            };
        }
        
        // Try to create the collection
        const collection = await databases.createCollection(
            DATABASE_ID,
            ID.unique(),
            WATCHLIST_COLLECTION_NAME,
            ['*'], // Read permissions for all users
            ['*']  // Write permissions for all users
        );
        
        console.log('Collection created:', collection);
        
        // Create required attributes with a delay between each to avoid rate limiting
        const createAttribute = async (name, type, required, defaultValue, isArray = false) => {
            console.log(`Creating attribute: ${name}`);
            try {
                if (type === 'string') {
                    await databases.createStringAttribute(
                        DATABASE_ID,
                        collection.$id,
                        name,
                        255,
                        required,
                        defaultValue,
                        isArray
                    );
                } else if (type === 'integer') {
                    await databases.createIntegerAttribute(
                        DATABASE_ID,
                        collection.$id,
                        name,
                        required,
                        defaultValue,
                        isArray
                    );
                }
                console.log(`Created attribute: ${name}`);
            } catch (error) {
                console.error(`Error creating attribute ${name}:`, error);
            }
            
            // Wait a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        };
        
        await createAttribute('userId', 'string', true, '');
        await createAttribute('movieId', 'integer', true, 0);
        await createAttribute('title', 'string', true, '');
        await createAttribute('poster_url', 'string', false, '');
        await createAttribute('createdAt', 'string', true, '');
        
        console.log('Watchlist collection created successfully with all attributes');
        return { success: true, collection };
    } catch (error) {
        console.error('Failed to create watchlist collection:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code,
            type: error.type
        };
    }
};

// Verify database and collection
export const verifyDatabaseConnection = async () => {
    try {
        // First check if environment variables are set
        if (!PROJECT_ID || !DATABASE_ID) {
            return {
                success: false,
                message: "Missing environment variables",
                error: `Required variables: ${!PROJECT_ID ? 'PROJECT_ID' : ''}${!PROJECT_ID && !DATABASE_ID ? ', ' : ''}${!DATABASE_ID ? 'DATABASE_ID' : ''}`
            };
        }
        
        console.log("Verifying database connection...");
        console.log("Using PROJECT_ID length:", PROJECT_ID.length);
        console.log("Using DATABASE_ID length:", DATABASE_ID.length);
        
        // Try to list databases to check if credentials are correct
        try {
            const databaseResult = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
            console.log("Database connection successful", databaseResult);
        } catch (dbError) {
            console.error("Error connecting to main database collection:", dbError);
            // Continue to check watchlist collection anyway
        }
        
        // Now check watchlist collection
        try {
            console.log(`Trying watchlist collection with name: ${WATCHLIST_COLLECTION_NAME}`);
            const watchlistResult = await databases.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_NAME, [Query.limit(1)]);
            console.log("Watchlist collection exists and is accessible", watchlistResult);
            return { success: true, message: "Database and watchlist collection verified" };
        } catch (error) {
            console.error("Watchlist collection error:", error);
            return { 
                success: false, 
                message: "Watchlist collection error", 
                error: error.message,
                code: error.code,
                type: error.type
            };
        }
    } catch (error) {
        console.error("Database connection error:", error);
        return { 
            success: false, 
            message: "Database connection failed", 
            error: error.message,
            code: error.code,
            type: error.type
        };
    }
};

// Call this function when the app starts
ensureCollections();

// 1) Add to Watchlist
export async function addToWatchlist(userId, movie) {
    try {
        // Validate inputs
        if (!userId || !movie || !movie.id) {
            console.error('Invalid parameters for addToWatchlist:', { userId, movie });
            throw new Error('Invalid parameters: userId and movie object with ID are required');
        }

        const watchlistItem = {
            userId,
            movieId: parseInt(movie.id, 10), // Convert to number since Appwrite expects a number
            title: movie.title || 'Unknown Title',
            poster_url: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                : '',
            createdAt: new Date().toISOString()
        };
        
        // Check if movie already exists in watchlist to avoid duplicates
        try {
            console.log(`Checking if movie ${movie.id} exists in watchlist for user ${userId}`);
            const existingItems = await databases.listDocuments(
                DATABASE_ID,
                WATCHLIST_COLLECTION_NAME,
                [
                    Query.equal('userId', userId),
                    Query.equal('movieId', parseInt(movie.id, 10)) // Use parseInt to ensure it's a number
                ]
            );
            
            if (existingItems.total > 0) {
                // Movie already in watchlist, return existing document
                console.log(`Movie ${movie.id} already exists in watchlist`);
                return existingItems.documents[0];
            }
            
            // Create new document
            console.log(`Adding movie ${movie.id} to watchlist`);
            return await databases.createDocument(
                DATABASE_ID,
                WATCHLIST_COLLECTION_NAME,
                ID.unique(),
                watchlistItem
            );
        } catch (error) {
            console.error(`Error in watchlist operation: ${error.message}`);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                type: error.type
            });
            
            // Add more specific error handling
            if (error.code === 404) {
                throw new Error('Watchlist collection not found. Please run the setup script: npm run setup-watchlist');
            }
            
            throw error;
        }
    } catch (error) {
        console.error('Add to watchlist error:', error);
        throw error;
    }
}

// 2) Remove from Watchlist
export async function removeFromWatchlist(docId) {
    try {
        if (!docId) {
            throw new Error('Document ID is required to remove from watchlist');
        }
        return await databases.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_NAME, docId);
    } catch (error) {
        console.error('Remove from watchlist error:', error);
        throw error;
    }
}

// 3) Fetch Watchlist for current user
export async function getWatchlist(userId) {
    try {
        if (!userId) {
            console.error('User ID is required to get watchlist');
            return [];
        }
        
        console.log(`Getting watchlist for user ${userId}`);
        const result = await databases.listDocuments(
            DATABASE_ID,
            WATCHLIST_COLLECTION_NAME,
            [
                Query.equal('userId', userId),
                Query.orderDesc('createdAt')
            ]
        );
        
        console.log(`Found ${result.documents.length} items in watchlist`);
        return result.documents;
    } catch (error) {
        console.error('Get watchlist error:', error);
        
        // Check if it's a collection not found error
        if (error.code === 404) {
            console.error('Watchlist collection not found. Please run the setup script.');
            return [];
        }
        
        throw error;
    }
}

// 4) Check if movie is in watchlist
export async function isInWatchlist(userId, movieId) {
    try {
        if (!userId || !movieId) {
            console.error('User ID and Movie ID are required to check watchlist');
            return false;
        }
        
        const numericMovieId = parseInt(movieId, 10);
        console.log(`Checking if movie ${numericMovieId} is in watchlist for user ${userId}`);
        
        const result = await databases.listDocuments(
            DATABASE_ID,
            WATCHLIST_COLLECTION_NAME,
            [
                Query.equal('userId', userId),
                Query.equal('movieId', numericMovieId)
            ]
        );
        
        return result.documents.length > 0 ? result.documents[0] : false;
    } catch (error) {
        console.error('Check watchlist status error:', error);
        return false;
    }
}

// 5) Add to Watched
export async function addToWatched(userId, movie) {
    return databases.createDocument(
        DATABASE_ID,
        'watched',
        ID.unique(),
        {
            userId,
            movieId: parseInt(movie.id, 10), // Use parseInt to ensure it's a number
            title: movie.title,
            poster_url: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                : '',
            watchedAt: new Date().toISOString()
        }
    );
}

// 6) Fetch Watched list
export async function getWatched(userId) {
    const res = await databases.listDocuments(DATABASE_ID, 'watched', [
        Query.equal('userId', userId),
        Query.orderDesc('watchedAt')
    ]);
    return res.documents;
}

// Enhanced error logging function
export const logError = (error) => {
    console.error('Appwrite Error:', error);
    
    let errorMessage = 'An unknown error occurred';
    let errorCode = error.code || 'unknown';
    
    if (error.message) {
        errorMessage = error.message;
    }
    
    // Provide more helpful messages for common error codes
    switch (errorCode) {
        case 404:
            errorMessage = 'Resource not found. Please check your database and collection IDs.';
            break;
        case 401:
            errorMessage = 'Authentication failed. Please check your Appwrite credentials.';
            break;
        case 403:
            errorMessage = 'Permission denied. Please check your collection permissions.';
            break;
        case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
        case 503:
            errorMessage = 'Appwrite service is unavailable. Please try again later.';
            break;
    }
    
    return {
        message: errorMessage,
        code: errorCode,
        original: error
    };
};