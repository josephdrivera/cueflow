/**
 * Cleanup Sample Data Script
 * 
 * This script removes the sample data created by the setup-firestore-schema.js script.
 * Run this after reviewing the sample data structure if you want to start with a clean database.
 */

require('dotenv').config();
const admin = require('firebase-admin');

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

// Delete sample data
async function cleanupSampleData() {
  console.log('Cleaning up sample data...');
  
  try {
    // Delete sample cues
    const showRef = firestore.collection('shows').doc('sample-show-id');
    const dayCueListRef = showRef.collection('dayCueLists').doc('sample-day-cue-list-id');
    const cuesRef = dayCueListRef.collection('cues');
    
    const cuesSnapshot = await cuesRef.get();
    const cueDeletePromises = cuesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(cueDeletePromises);
    console.log('Deleted sample cues');
    
    // Delete sample day cue list
    await dayCueListRef.delete();
    console.log('Deleted sample day cue list');
    
    // Delete sample collaborators
    const collaboratorsRef = showRef.collection('collaborators');
    const collaboratorsSnapshot = await collaboratorsRef.get();
    const collaboratorDeletePromises = collaboratorsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(collaboratorDeletePromises);
    console.log('Deleted sample collaborators');
    
    // Delete sample show
    await showRef.delete();
    console.log('Deleted sample show');
    
    // Delete sample user
    await firestore.collection('users').doc('sample-user-id').delete();
    console.log('Deleted sample user');
    
    // Delete sample invitation
    await firestore.collection('invitations').doc('sample-invitation-id').delete();
    console.log('Deleted sample invitation');
    
    console.log('Sample data cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
  }
}

// Run the cleanup
cleanupSampleData();
