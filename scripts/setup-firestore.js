/**
 * Firebase Firestore Setup Script
 * 
 * This script sets up the initial Firestore database structure and security rules.
 * Run this before migrating data to ensure the proper structure is in place.
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

// Create initial collections and documents
async function setupFirestore() {
  console.log('Setting up Firestore collections and structure...');
  
  try {
    // Create users collection
    await firestore.collection('users').doc('example-user-id').set({
      uid: 'example-user-id',
      email: 'example@example.com',
      username: 'example_user',
      fullName: 'Example User',
      avatarUrl: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {}
    });
    console.log('Created example user document');
    
    // Create shows collection
    const showRef = firestore.collection('shows').doc('example-show-id');
    await showRef.set({
      title: 'Example Show',
      description: 'This is an example show',
      creatorId: 'example-user-id',
      isTemplate: false,
      metadata: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created example show document');
    
    // Create day cue lists subcollection
    const dayCueListRef = showRef.collection('dayCueLists').doc('example-day-cue-list-id');
    await dayCueListRef.set({
      name: 'Example Day Cue List',
      date: '2025-03-01',
      description: 'Example day cue list',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created example day cue list document');
    
    // Create cues subcollection
    await dayCueListRef.collection('cues').doc('example-cue-id').set({
      cueNumber: '1.0',
      displayId: 'CUE001',
      startTime: '10:00:00',
      runTime: '00:05:00',
      endTime: '10:05:00',
      activity: 'Example activity',
      graphics: '',
      video: '',
      audio: '',
      lighting: '',
      notes: '',
      previousCueId: '',
      nextCueId: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created example cue document');
    
    // Create collaborators subcollection
    await showRef.collection('collaborators').doc('example-collaborator-id').set({
      userId: 'example-collaborator-id',
      canEdit: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created example collaborator document');
    
    // Create invitations collection
    await firestore.collection('invitations').doc('example-invitation-id').set({
      showId: 'example-show-id',
      email: 'collaborator@example.com',
      canEdit: true,
      token: 'example-token',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    });
    console.log('Created example invitation document');
    
    console.log('Firestore setup completed successfully!');
    
    // Clean up example documents
    console.log('Cleaning up example documents...');
    await firestore.collection('users').doc('example-user-id').delete();
    await firestore.collection('invitations').doc('example-invitation-id').delete();
    await dayCueListRef.collection('cues').doc('example-cue-id').delete();
    await dayCueListRef.delete();
    await showRef.collection('collaborators').doc('example-collaborator-id').delete();
    await showRef.delete();
    console.log('Example documents cleaned up');
    
  } catch (error) {
    console.error('Error setting up Firestore:', error);
  }
}

// Run the setup
setupFirestore();
