// Firebase Firestore utility functions to replace Supabase operations
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Generic type for Firestore query results
interface FirestoreQueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

interface FirestoreDocResult<T> {
  data: T | null;
  error: Error | null;
}

// Function to fetch documents from a collection with filters
export async function fetchCollection<T>(
  collectionName: string,
  filters?: { field: string; operator: string; value: any }[],
  sortOptions?: { field: string; direction: 'asc' | 'desc' }[]
): Promise<FirestoreQueryResult<T>> {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters if provided
    if (filters && filters.length > 0) {
      const queryConstraints = filters.map(filter => {
        // Map Supabase-style operators to Firestore operators
        const firestoreOperator = mapOperator(filter.operator);
        return where(filter.field, firestoreOperator, filter.value);
      });
      
      q = query(q, ...queryConstraints);
    }
    
    // Apply sorting if provided
    if (sortOptions && sortOptions.length > 0) {
      const orderByConstraints = sortOptions.map(sort => 
        orderBy(sort.field, sort.direction)
      );
      
      q = query(q, ...orderByConstraints);
    }
    
    const querySnapshot = await getDocs(q);
    
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return { data: null, error: error as Error };
  }
}

// Function to get a single document by ID
export async function fetchDocument<T>(
  collectionName: string,
  documentId: string
): Promise<FirestoreDocResult<T>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...docSnap.data()
      } as T;
      
      return { data, error: null };
    } else {
      return { data: null, error: new Error('Document not found') };
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    return { data: null, error: error as Error };
  }
}

// Function to insert a document
export async function insertDocument<T>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<FirestoreDocResult<T>> {
  try {
    // Add created_at timestamp if it doesn't exist
    const dataWithTimestamp = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
    
    // Fetch the newly created document to return it
    const newDocSnap = await getDoc(docRef);
    
    const newData = {
      id: docRef.id,
      ...newDocSnap.data()
    } as T;
    
    return { data: newData, error: null };
  } catch (error) {
    console.error('Error inserting document:', error);
    return { data: null, error: error as Error };
  }
}

// Function to update a document
export async function updateDocument<T>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<FirestoreDocResult<T>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    
    // Add updated_at timestamp
    const dataWithTimestamp = {
      ...data,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    
    // Fetch the updated document to return it
    const updatedDocSnap = await getDoc(docRef);
    
    if (updatedDocSnap.exists()) {
      const updatedData = {
        id: updatedDocSnap.id,
        ...updatedDocSnap.data()
      } as T;
      
      return { data: updatedData, error: null };
    } else {
      return { data: null, error: new Error('Document not found after update') };
    }
  } catch (error) {
    console.error('Error updating document:', error);
    return { data: null, error: error as Error };
  }
}

// Function to delete a document
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<{ error: Error | null }> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error as Error };
  }
}

// Helper function to map Supabase operators to Firestore operators
function mapOperator(supabaseOperator: string): string {
  switch (supabaseOperator) {
    case 'eq':
      return '==';
    case 'neq':
      return '!=';
    case 'gt':
      return '>';
    case 'gte':
      return '>=';
    case 'lt':
      return '<';
    case 'lte':
      return '<=';
    case 'in':
      return 'in';
    case 'contains':
      return 'array-contains';
    default:
      return '==';
  }
}

// Convert Firestore Timestamp to ISO string (for date handling)
export function timestampToISOString(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

// Convert ISO string to Firestore Timestamp
export function isoStringToTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}
