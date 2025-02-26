/**
 * Firestore Schema Setup Script for CueFlow
 * 
 * This script creates the necessary collections and sample documents
 * in Firestore based on the CueFlow schema design.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account key not found at:', serviceAccountPath);
    console.error('Please generate a service account key from the Firebase console and save it as serviceAccountKey.json in the parent directory.');
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.error('Make sure you have placed your serviceAccountKey.json file in the parent directory');
  process.exit(1);
}

const firestore = admin.firestore();

/**
 * Create the Firestore schema with sample documents
 */
async function setupFirestoreSchema() {
  console.log('Setting up Firestore collections and schema structure...');
  
  try {
    // Create users collection with sample user
    const userRef = firestore.collection('users').doc('sample-user-id');
    await userRef.set({
      uid: 'sample-user-id',
      email: 'user@example.com',
      username: 'sampleuser',
      fullName: 'Sample User',
      avatarUrl: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        theme: 'light',
        notifications: true
      }
    });
    console.log('Created users collection with sample document');
    
    // Create shows collection with sample show
    const showRef = firestore.collection('shows').doc('sample-show-id');
    await showRef.set({
      title: 'Sample Show',
      description: 'This is a sample show to demonstrate the schema structure',
      creatorId: 'sample-user-id',
      isPublished: false,
      isTemplate: false,
      status: 'draft',
      metadata: {
        venue: 'Sample Theater',
        duration: '120 minutes',
        customField1: 'Custom value 1',
        customField2: 'Custom value 2'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created shows collection with sample document');
    
    // Create day cue lists subcollection with sample day cue list
    const dayCueListRef = showRef.collection('dayCueLists').doc('sample-day-cue-list-id');
    await dayCueListRef.set({
      name: 'Opening Night',
      date: '2025-03-15',
      description: 'Opening night cue list',
      isActive: true,
      orderIndex: 1,
      durationSeconds: 7200,
      metadata: {
        notes: 'Special instructions for opening night',
        venue: 'Main Stage'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created dayCueLists subcollection with sample document');
    
    // Create cues subcollection with sample cues
    const cuesRef = dayCueListRef.collection('cues');
    
    // Sample cue 1
    await cuesRef.doc('sample-cue-id-1').set({
      cueNumber: '1.0',
      displayId: 'OPEN-001',
      startTime: '19:30:00',
      runTime: '00:02:00',
      endTime: '19:32:00',
      activity: 'House lights dim',
      graphics: '',
      video: '',
      audio: 'Fade in opening music',
      lighting: 'Dim house lights to 30%',
      notes: 'Wait for audience to settle',
      previousCueId: '',
      nextCueId: 'sample-cue-id-2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Sample cue 2
    await cuesRef.doc('sample-cue-id-2').set({
      cueNumber: '2.0',
      displayId: 'OPEN-002',
      startTime: '19:32:00',
      runTime: '00:01:00',
      endTime: '19:33:00',
      activity: 'Curtain rises',
      graphics: '',
      video: '',
      audio: 'Increase music volume',
      lighting: 'Stage lights up',
      notes: 'Ensure all actors are in position',
      previousCueId: 'sample-cue-id-1',
      nextCueId: 'sample-cue-id-3',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Sample cue 3
    await cuesRef.doc('sample-cue-id-3').set({
      cueNumber: '3.0',
      displayId: 'OPEN-003',
      startTime: '19:33:00',
      runTime: '00:05:00',
      endTime: '19:38:00',
      activity: 'Opening scene',
      graphics: 'Project background image',
      video: 'Start intro video',
      audio: 'Fade music to background level',
      lighting: 'Spotlight on main character',
      notes: 'Video should sync with actor movement',
      previousCueId: 'sample-cue-id-2',
      nextCueId: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created cues subcollection with sample documents');
    
    // Create collaborators subcollection with sample collaborator
    const collaboratorsRef = showRef.collection('collaborators');
    await collaboratorsRef.doc('sample-collaborator-id').set({
      userId: 'sample-collaborator-id',
      canEdit: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created collaborators subcollection with sample document');
    
    // Create invitations collection with sample invitation
    await firestore.collection('invitations').doc('sample-invitation-id').set({
      showId: 'sample-show-id',
      email: 'collaborator@example.com',
      canEdit: true,
      token: 'sample-invitation-token',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    });
    console.log('Created invitations collection with sample document');
    
    // Create a second show with different structure to demonstrate variety
    const showRef2 = firestore.collection('shows').doc('sample-show-id-2');
    await showRef2.set({
      title: 'Another Sample Show',
      description: 'This is another sample show with a different structure',
      creatorId: 'sample-user-id',
      isPublished: true,
      isTemplate: true,
      status: 'published',
      metadata: {
        venue: 'Small Theater',
        duration: '90 minutes',
        genre: 'Drama',
        audience: 'Adults'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a different day cue list for the second show
    const dayCueListRef2 = showRef2.collection('dayCueLists').doc('sample-day-cue-list-id-2');
    await dayCueListRef2.set({
      name: 'Preview Night',
      date: '2025-03-10',
      description: 'Preview night cue list',
      isActive: true,
      orderIndex: 1,
      durationSeconds: 5400,
      metadata: {
        notes: 'Preview performance with potential adjustments',
        venue: 'Small Theater'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Add a few cues to the second day cue list
    const cuesRef2 = dayCueListRef2.collection('cues');
    await cuesRef2.doc('sample-cue-id-4').set({
      cueNumber: '1.0',
      displayId: 'PREV-001',
      startTime: '19:00:00',
      runTime: '00:03:00',
      endTime: '19:03:00',
      activity: 'Pre-show announcement',
      graphics: '',
      video: '',
      audio: 'Play pre-recorded announcement',
      lighting: 'House lights at 50%',
      notes: 'Make sure announcement is clear and audible',
      previousCueId: '',
      nextCueId: 'sample-cue-id-5',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await cuesRef2.doc('sample-cue-id-5').set({
      cueNumber: '2.0',
      displayId: 'PREV-002',
      startTime: '19:03:00',
      runTime: '00:02:00',
      endTime: '19:05:00',
      activity: 'House lights down',
      graphics: '',
      video: '',
      audio: 'Start ambient music',
      lighting: 'Fade house lights to 0%',
      notes: 'Slow fade over 2 minutes',
      previousCueId: 'sample-cue-id-4',
      nextCueId: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created second sample show with day cue list and cues');
    
    // Create security rules collection to store rule templates
    await firestore.collection('securityRules').doc('default').set({
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Users can read and write their own data
            match /users/{userId} {
              allow read: if request.auth != null && request.auth.uid == userId;
              allow write: if request.auth != null && request.auth.uid == userId;
            }
            
            // Shows can be read by collaborators and created by authenticated users
            match /shows/{showId} {
              allow read: if request.auth != null && (
                resource.data.creatorId == request.auth.uid || 
                exists(/databases/$(database)/documents/shows/$(showId)/collaborators/$(request.auth.uid))
              );
              allow create: if request.auth != null;
              allow update, delete: if request.auth != null && resource.data.creatorId == request.auth.uid;
              
              // Day cue lists inherit permissions from parent show
              match /dayCueLists/{dayCueListId} {
                allow read, write: if request.auth != null && (
                  get(/databases/$(database)/documents/shows/$(showId)).data.creatorId == request.auth.uid ||
                  exists(/databases/$(database)/documents/shows/$(showId)/collaborators/$(request.auth.uid))
                );
                
                // Cues inherit permissions from parent day cue list
                match /cues/{cueId} {
                  allow read, write: if request.auth != null && (
                    get(/databases/$(database)/documents/shows/$(showId)).data.creatorId == request.auth.uid ||
                    exists(/databases/$(database)/documents/shows/$(showId)/collaborators/$(request.auth.uid))
                  );
                }
              }
              
              // Collaborators can be managed by the show creator
              match /collaborators/{userId} {
                allow read: if request.auth != null && (
                  get(/databases/$(database)/documents/shows/$(showId)).data.creatorId == request.auth.uid ||
                  request.auth.uid == userId
                );
                allow write: if request.auth != null && 
                  get(/databases/$(database)/documents/shows/$(showId)).data.creatorId == request.auth.uid;
              }
            }
            
            // Invitations can be read by the creator of the associated show
            match /invitations/{invitationId} {
              allow read, write: if request.auth != null && 
                get(/databases/$(database)/documents/shows/$(resource.data.showId)).data.creatorId == request.auth.uid;
            }
          }
        }
      `,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created securityRules collection with default rules template');
    
    console.log('\nFirestore schema setup completed successfully!');
    console.log('\nSample data has been created to demonstrate the schema structure.');
    console.log('You can keep this sample data for reference or delete it later.');
    
  } catch (error) {
    console.error('Error setting up Firestore schema:', error);
    process.exit(1);
  }
}

// Function to clean up sample data if needed
async function cleanupSampleData() {
  console.log('Cleaning up sample data...');
  
  try {
    // Delete sample documents
    await firestore.collection('users').doc('sample-user-id').delete();
    
    // Delete sample shows and their subcollections
    const showRef = firestore.collection('shows').doc('sample-show-id');
    await deleteCollectionRecursive(showRef.collection('dayCueLists'));
    await showRef.delete();
    
    const showRef2 = firestore.collection('shows').doc('sample-show-id-2');
    await deleteCollectionRecursive(showRef2.collection('dayCueLists'));
    await showRef2.delete();
    
    // Delete sample invitations
    await firestore.collection('invitations').doc('sample-invitation-id').delete();
    
    console.log('Sample data cleanup completed successfully!');
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
    process.exit(1);
  }
}

// Helper function to recursively delete a collection
async function deleteCollectionRecursive(collectionRef) {
  const snapshot = await collectionRef.get();
  
  for (const doc of snapshot.docs) {
    const docRef = collectionRef.doc(doc.id);
    const collections = await docRef.listCollections();
    
    for (const subCollection of collections) {
      await deleteCollectionRecursive(subCollection);
    }
    
    await docRef.delete();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
  cleanupSampleData();
} else {
  setupFirestoreSchema();
}
