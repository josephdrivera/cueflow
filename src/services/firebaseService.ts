// src/services/firebaseService.ts

import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    onSnapshot,
    QueryConstraint
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  
  // Generic type for query result
  export interface QueryResult<T> {
    data: T[] | null;
    error: Error | null;
  }
  
  export interface SingleResult<T> {
    data: T | null;
    error: Error | null;
  }
  
  /**
   * Get a collection of documents with optional filters and sorting
   */
  export async function getCollection<T>(
    collectionName: string,
    filters?: { field: string; operator: string; value: any }[],
    sortOptions?: { field: string; direction: 'asc' | 'desc' }[]
  ): Promise<QueryResult<T>> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Add filters if provided
      if (filters && filters.length > 0) {
        filters.forEach(filter => {
          // Map operator strings to Firebase operators
          const operator = mapOperator(filter.operator);
          constraints.push(where(filter.field, operator, filter.value));
        });
      }
      
      // Add sorting if provided
      if (sortOptions && sortOptions.length > 0) {
        sortOptions.forEach(sort => {
          constraints.push(orderBy(sort.field, sort.direction));
        });
      }
      
      // Create query
      const q = query(collection(db, collectionName), ...constraints);
      
      // Execute query
      const querySnapshot = await getDocs(q);
      
      // Map results to desired format
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      return { data: documents, error: null };
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Get a single document by ID
   */
  export async function getDocument<T>(
    collectionName: string,
    documentId: string
  ): Promise<SingleResult<T>> {
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
        return { data: null, error: new Error(`Document not found: ${documentId}`) };
      }
    } catch (error) {
      console.error(`Error getting document ${documentId}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Create a new document
   */
  export async function addDocument<T>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<SingleResult<T>> {
    try {
      // Add timestamps
      const docData = {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      // Get the newly created document
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const newDoc = {
          id: docRef.id,
          ...docSnap.data()
        } as T;
        
        return { data: newDoc, error: null };
      } else {
        throw new Error('Failed to create document');
      }
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Update an existing document
   */
  export async function updateDocument<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>
  ): Promise<SingleResult<T>> {
    try {
      const docRef = doc(db, collectionName, documentId);
      
      // Add updated timestamp
      const updateData = {
        ...data,
        updated_at: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Get the updated document
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const updatedDoc = {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
        
        return { data: updatedDoc, error: null };
      } else {
        throw new Error(`Document not found after update: ${documentId}`);
      }
    } catch (error) {
      console.error(`Error updating document ${documentId}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Delete a document
   */
  export async function deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<{ error: Error | null }> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      return { error: null };
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Subscribe to real-time updates for a collection
   */
  export function subscribeToCollection<T>(
    collectionName: string,
    filters: { field: string; operator: string; value: any }[] | null,
    sortOptions: { field: string; direction: 'asc' | 'desc' }[] | null,
    callback: (result: QueryResult<T>) => void
  ): () => void {
    const constraints: QueryConstraint[] = [];
    
    // Add filters if provided
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        const operator = mapOperator(filter.operator);
        constraints.push(where(filter.field, operator, filter.value));
      });
    }
    
    // Add sorting if provided
    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach(sort => {
        constraints.push(orderBy(sort.field, sort.direction));
      });
    }
    
    // Create query
    const q = query(collection(db, collectionName), ...constraints);
    
    // Subscribe to changes
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        callback({ data: documents, error: null });
      },
      (error) => {
        console.error(`Error in subscription to ${collectionName}:`, error);
        callback({ data: null, error });
      }
    );
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  /**
   * Subscribe to real-time updates for a single document
   */
  export function subscribeToDocument<T>(
    collectionName: string,
    documentId: string,
    callback: (result: SingleResult<T>) => void
  ): () => void {
    const docRef = doc(db, collectionName, documentId);
    
    // Subscribe to changes
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as T;
          
          callback({ data, error: null });
        } else {
          callback({ data: null, error: new Error(`Document not found: ${documentId}`) });
        }
      },
      (error) => {
        console.error(`Error in subscription to document ${documentId}:`, error);
        callback({ data: null, error });
      }
    );
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  // Helper function to map operator strings to Firebase operators
  function mapOperator(operator: string): string {
    switch (operator) {
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