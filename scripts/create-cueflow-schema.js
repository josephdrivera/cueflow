/**
 * CueFlow Firestore Schema Setup Script
 * 
 * This script creates the Firestore schema based on the existing Supabase schema
 * for the CueFlow application, preserving all relationships and field structures.
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
 * Create the Firestore schema with sample documents based on the Supabase schema
 */
async function setupFirestoreSchema() {
  console.log('Setting up CueFlow Firestore schema based on Supabase structure...');
  
  try {
    // Create profiles collection with sample profile
    const profileRef = firestore.collection('profiles').doc('sample-profile-id');
    await profileRef.set({
      id: 'sample-profile-id',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      username: 'sampleuser',
      full_name: 'Sample User',
      avatar_url: 'https://example.com/avatar.jpg',
      role: 'admin'
    });
    console.log('Created profiles collection with sample document');
    
    // Create shows collection with sample show
    const showRef = firestore.collection('shows').doc('sample-show-id');
    await showRef.set({
      id: 'sample-show-id',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      title: 'Sample Show',
      description: 'This is a sample show to demonstrate the schema structure',
      created_by: 'sample-profile-id',
      is_template: false,
      is_archived: false,
      user_id: 'sample-profile-id',
      metadata: {
        venue: 'Sample Theater',
        duration: '120 minutes'
      }
    });
    console.log('Created shows collection with sample document');
    
    // Create day_cue_lists collection with sample day cue list
    const dayCueListRef = firestore.collection('day_cue_lists').doc('sample-day-cue-list-id');
    await dayCueListRef.set({
      id: 'sample-day-cue-list-id',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      show_id: 'sample-show-id',
      name: 'Opening Night',
      date: '2025-03-15',
      description: 'Opening night cue list',
      is_active: true,
      order_index: 1,
      metadata: {
        notes: 'Special instructions for opening night',
        venue: 'Main Stage'
      }
    });
    console.log('Created day_cue_lists collection with sample document');
    
    // Create cues collection with sample cues
    // Sample cue 1
    await firestore.collection('cues').doc('sample-cue-id-1').set({
      id: 'sample-cue-id-1',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      day_cue_list_id: 'sample-day-cue-list-id',
      cue_number: '1.0',
      display_id: 'OPEN-001',
      start_time: '19:30:00',
      run_time: '00:02:00',
      end_time: '19:32:00',
      activity: 'House lights dim',
      graphics: '',
      video: '',
      audio: 'Fade in opening music',
      lighting: 'Dim house lights to 30%',
      notes: 'Wait for audience to settle',
      previous_cue_id: '',
      next_cue_id: 'sample-cue-id-2',
      cue_list_id: 'sample-day-cue-list-id'
    });
    
    // Sample cue 2
    await firestore.collection('cues').doc('sample-cue-id-2').set({
      id: 'sample-cue-id-2',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      day_cue_list_id: 'sample-day-cue-list-id',
      cue_number: '2.0',
      display_id: 'OPEN-002',
      start_time: '19:32:00',
      run_time: '00:01:00',
      end_time: '19:33:00',
      activity: 'Curtain rises',
      graphics: '',
      video: '',
      audio: 'Increase music volume',
      lighting: 'Stage lights up',
      notes: 'Ensure all actors are in position',
      previous_cue_id: 'sample-cue-id-1',
      next_cue_id: 'sample-cue-id-3',
      cue_list_id: 'sample-day-cue-list-id'
    });
    
    // Sample cue 3
    await firestore.collection('cues').doc('sample-cue-id-3').set({
      id: 'sample-cue-id-3',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      day_cue_list_id: 'sample-day-cue-list-id',
      cue_number: '3.0',
      display_id: 'OPEN-003',
      start_time: '19:33:00',
      run_time: '00:05:00',
      end_time: '19:38:00',
      activity: 'Opening scene',
      graphics: 'Project background image',
      video: 'Start intro video',
      audio: 'Fade music to background level',
      lighting: 'Spotlight on main character',
      notes: 'Video should sync with actor movement',
      previous_cue_id: 'sample-cue-id-2',
      next_cue_id: '',
      cue_list_id: 'sample-day-cue-list-id'
    });
    
    console.log('Created cues collection with sample documents');
    
    // Create show_collaborators collection with sample collaborator
    await firestore.collection('show_collaborators').doc('sample-collaborator-id').set({
      id: 'sample-collaborator-id',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      show_id: 'sample-show-id',
      user_id: 'sample-collaborator-user-id',
      email: 'collaborator@example.com',
      can_edit: true,
      token: 'sample-token'
    });
    console.log('Created show_collaborators collection with sample document');
    
    // Create files collection with sample file
    await firestore.collection('files').doc('sample-file-id').set({
      id: 'sample-file-id',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      name: 'Sample File',
      file_type: 'image/jpeg',
      storage_path: 'files/sample-file.jpg',
      size_bytes: 12345,
      metadata: {
        width: 1920,
        height: 1080
      },
      show_id: 'sample-show-id'
    });
    console.log('Created files collection with sample document');
    
    // Create show_flows collection with sample show flow
    await firestore.collection('show_flows').doc('sample-show-flow-id').set({
      id: 'sample-show-flow-id',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      show_id: 'sample-show-id',
      name: 'Main Flow',
      description: 'Main flow for the show',
      flow_data: {
        nodes: [
          { id: 'node1', type: 'start', position: { x: 100, y: 100 } },
          { id: 'node2', type: 'cue', position: { x: 200, y: 200 } }
        ],
        edges: [
          { id: 'edge1', source: 'node1', target: 'node2' }
        ]
      },
      is_active: true,
      version: 1
    });
    console.log('Created show_flows collection with sample document');
    
    // Create day_cue_lists collection with sample day cue list
    const dayCueListsRef = firestore.collection('day_cue_lists');
    
    // Sample day cue list 1
    await dayCueListsRef.doc('sample-day-cue-list-id-2').set({
      id: 'sample-day-cue-list-id-2',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      show_id: 'sample-show-id',
      name: 'Preview Night',
      date: '2025-03-10',
      description: 'Preview night cue list',
      is_active: true,
      order_index: 0
    });
    
    console.log('Created additional day_cue_lists documents');
    
    console.log('\nCueFlow Firestore schema setup completed successfully!');
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
    await firestore.collection('profiles').doc('sample-profile-id').delete();
    await firestore.collection('shows').doc('sample-show-id').delete();
    await firestore.collection('day_cue_lists').doc('sample-day-cue-list-id').delete();
    await firestore.collection('day_cue_lists').doc('sample-day-cue-list-id-2').delete();
    await firestore.collection('cues').doc('sample-cue-id-1').delete();
    await firestore.collection('cues').doc('sample-cue-id-2').delete();
    await firestore.collection('cues').doc('sample-cue-id-3').delete();
    await firestore.collection('show_collaborators').doc('sample-collaborator-id').delete();
    await firestore.collection('files').doc('sample-file-id').delete();
    await firestore.collection('show_flows').doc('sample-show-flow-id').delete();
    
    console.log('Sample data cleanup completed successfully!');
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
  cleanupSampleData();
} else {
  setupFirestoreSchema();
}
