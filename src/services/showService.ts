import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, serverTimestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'shows';

export interface Show {
  id: string;
  title: string;
  description?: string;
  creator_id?: string;
  is_template?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface NewShow {
  title: string;
  description?: string;
  is_template?: boolean;
  metadata?: Record<string, any>;
}

// Helper function to convert Firestore document to Show type
const convertToShow = (doc: QueryDocumentSnapshot<DocumentData>): Show => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    creator_id: data.creator_id,
    is_template: data.is_template,
    metadata: data.metadata,
    created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at.toDate()).toISOString() : undefined
  };
};

export async function createShow(show: NewShow): Promise<Show> {
  try {
    const newShow = {
      title: show.title,
      description: show.description,
      is_template: show.is_template || false,
      metadata: show.metadata || {},
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newShow);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('No data returned from show creation');
    }
    
    return {
      id: docRef.id,
      ...docSnap.data() as Omit<Show, 'id'>
    };
  } catch (error) {
    console.error('Error in createShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function getShowById(id: string): Promise<Show> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Show not found with id: ${id}`);
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data() as Omit<Show, 'id'>
    };
  } catch (error) {
    console.error('Error in getShowById:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function getAllShows(): Promise<Show[]> {
  try {
    // Note: Authentication check would need to be handled separately with Firebase Auth
    
    const q = query(collection(db, COLLECTION_NAME), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(convertToShow);
  } catch (error) {
    console.error('Error in getAllShows:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function updateShow(id: string, show: Partial<Show>): Promise<Show> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Add updated_at timestamp
    const updateData = {
      ...show,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    
    // Get the updated document
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Show not found with id: ${id}`);
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data() as Omit<Show, 'id'>
    };
  } catch (error) {
    console.error('Error in updateShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function deleteShow(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error in deleteShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}
