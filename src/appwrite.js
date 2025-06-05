// appwrite.js
import { Client, Databases, ID, Query } from 'appwrite';

const DATABASE_ID   = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID    = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
  .setProject(PROJECT_ID);

const databases = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  if (!searchTerm) return;

  try {
    // 1. Check if the search term already exists
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('searchTerm', searchTerm)]
    );

    if (result.total > 0 && result.documents.length > 0) {
      // 2. If it exists, increment its count
      const doc = result.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        { count: doc.count + 1 }
      );
    } else {
      // 3. If it doesn't exist, create a new document
      const newDocument = {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
          : ''
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        newDocument
      );
    }
  } catch (error) {
    console.error('Error updating search count:', error);
  }

  console.log('Appwrite IDs:', PROJECT_ID, DATABASE_ID, COLLECTION_ID);
};

export const getTrendingMovies = async () => {
  try {
    // List up to 10 documents ordered by descending count
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('count'),
        Query.limit(5)
      ]
    );

    // Return the fetched documents array (or [] if none)
    return result.documents || [];
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
};
