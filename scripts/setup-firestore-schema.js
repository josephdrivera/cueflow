/**
 * Firebase Firestore Schema Setup Script
 * 
 * This script sets up the Firestore database structure based on the CueFlow schema design.
 * Since there's no data to migrate from Supabase, this script creates the collection structure
 * and sets up initial security rules.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.error('Make sure you have placed your serviceAccountKey.json file in the parent directory');
  process.exit(1);
}

const firestore = admin.firestore();

// Create initial collections and sample documents
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
      isTemplate: false,
      metadata: {
        venue: 'Sample Theater',
        duration: '120 minutes'
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
    
    console.log('Firestore schema setup completed successfully!');
    
    // Ask if user wants to keep or delete sample data
    console.log('\nSample data has been created to demonstrate the schema structure.');
    console.log('You can keep this sample data for reference or delete it.');
    console.log('To delete the sample data, run: npm run cleanup-samples');
    
  } catch (error) {
    console.error('Error setting up Firestore schema:', error);
  }
}

// Run the setup
setupFirestoreSchema();
