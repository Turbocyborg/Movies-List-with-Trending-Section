import { Client, Databases, Account } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const WATCHLIST_COLLECTION_NAME = 'watchlists';

console.log('=== Appwrite Configuration Check ===');
console.log('Environment Variables:');
console.log(`- PROJECT_ID: ${PROJECT_ID ? '✓ Set' : '✗ Missing'} (length: ${PROJECT_ID?.length || 0})`);
console.log(`- DATABASE_ID: ${DATABASE_ID ? '✓ Set' : '✗ Missing'} (length: ${DATABASE_ID?.length || 0})`);

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID || '');

const databases = new Databases(client);
const account = new Account(client);

async function checkAppwriteConfiguration() {
    console.log('\nChecking Appwrite configuration...');
    
    // Check if required environment variables are set
    if (!PROJECT_ID || !DATABASE_ID) {
        console.error('❌ Missing required environment variables!');
        console.log('Please create a .env file in your project root with:');
        console.log('VITE_APPWRITE_PROJECT_ID=your_project_id');
        console.log('VITE_APPWRITE_DATABASE_ID=your_database_id');
        return;
    }
    
    // Check if we can connect to Appwrite
    try {
        console.log('\nTesting Appwrite connection...');
        const session = await account.getSession('current').catch(() => null);
        console.log(`- Appwrite Connection: ${session ? '✓ Connected' : '✗ Not connected (this is normal if not logged in)'}`);
    } catch (error) {
        console.error('❌ Failed to connect to Appwrite:', error.message);
    }
    
    // Check if database exists
    try {
        console.log('\nChecking database...');
        await databases.get(DATABASE_ID);
        console.log(`- Database (${DATABASE_ID}): ✓ Exists`);
    } catch (error) {
        console.error(`❌ Database error: ${error.message}`);
        console.log('Please check if your DATABASE_ID is correct');
    }
    
    // Check if watchlist collection exists
    try {
        console.log('\nChecking watchlist collection...');
        const collections = await databases.listCollections(DATABASE_ID);
        
        const watchlistCollection = collections.collections.find(
            collection => collection.name === WATCHLIST_COLLECTION_NAME
        );
        
        if (watchlistCollection) {
            console.log(`- Collection '${WATCHLIST_COLLECTION_NAME}': ✓ Exists (ID: ${watchlistCollection.$id})`);
            
            // Check collection attributes
            try {
                const attributes = await databases.listAttributes(DATABASE_ID, watchlistCollection.$id);
                console.log('- Collection attributes:');
                
                const requiredAttributes = ['userId', 'movieId', 'title', 'poster_url', 'createdAt'];
                const foundAttributes = attributes.attributes.map(attr => attr.key);
                
                for (const attr of requiredAttributes) {
                    console.log(`  - ${attr}: ${foundAttributes.includes(attr) ? '✓' : '✗'}`);
                }
                
                // Check if movieId is integer type
                const movieIdAttr = attributes.attributes.find(attr => attr.key === 'movieId');
                if (movieIdAttr) {
                    console.log(`  - movieId type: ${movieIdAttr.type === 'integer' ? '✓ integer' : '✗ not integer'}`);
                }
            } catch (error) {
                console.error('❌ Failed to check collection attributes:', error.message);
            }
        } else {
            console.error(`❌ Collection '${WATCHLIST_COLLECTION_NAME}' does not exist!`);
            console.log('Please run: npm run setup-watchlist');
        }
    } catch (error) {
        console.error(`❌ Failed to check collections: ${error.message}`);
    }
    
    console.log('\n=== Configuration Check Complete ===');
    console.log('If you found any issues, please fix them and restart your application.');
}

checkAppwriteConfiguration().catch(error => {
    console.error('Unexpected error during configuration check:', error);
}); 