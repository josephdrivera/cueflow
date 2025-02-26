/**
 * CueFlow Data Migration Script
 * 
 * This script migrates data from Supabase to Firestore for the CueFlow application,
 * preserving all relationships and field structures.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and service key must be provided in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
 * Migrate data from Supabase to Firestore
 */
async function migrateData() {
  console.log('Starting CueFlow data migration from Supabase to Firestore...');
  
  try {
    // Migrate profiles
    console.log('Migrating profiles...');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }
    
    const profileBatch = firestore.batch();
    for (const profile of profiles) {
      const profileRef = firestore.collection('profiles').doc(profile.id);
      profileBatch.set(profileRef, {
        id: profile.id,
        updated_at: admin.firestore.Timestamp.fromDate(new Date(profile.updated_at)),
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: profile.role || 'user'
      });
    }
    
    await profileBatch.commit();
    console.log(`Migrated ${profiles.length} profiles`);
    
    // Migrate shows
    console.log('Migrating shows...');
    const { data: shows, error: showsError } = await supabase.from('shows').select('*');
    
    if (showsError) {
      throw new Error(`Error fetching shows: ${showsError.message}`);
    }
    
    const showBatch = firestore.batch();
    for (const show of shows) {
      const showRef = firestore.collection('shows').doc(show.id);
      showBatch.set(showRef, {
        id: show.id,
        created_at: admin.firestore.Timestamp.fromDate(new Date(show.created_at)),
        updated_at: admin.firestore.Timestamp.fromDate(new Date(show.updated_at)),
        title: show.title,
        description: show.description || '',
        created_by: show.created_by,
        is_template: show.is_template || false,
        is_archived: show.is_archived || false,
        user_id: show.user_id,
        metadata: show.metadata || {}
      });
    }
    
    await showBatch.commit();
    console.log(`Migrated ${shows.length} shows`);
    
    // Migrate day cue lists
    console.log('Migrating day cue lists...');
    const { data: dayCueLists, error: dayCueListsError } = await supabase.from('day_cue_lists').select('*');
    
    if (dayCueListsError) {
      throw new Error(`Error fetching day cue lists: ${dayCueListsError.message}`);
    }
    
    const dayCueListBatch = firestore.batch();
    for (const dayCueList of dayCueLists) {
      const dayCueListRef = firestore.collection('day_cue_lists').doc(dayCueList.id);
      dayCueListBatch.set(dayCueListRef, {
        id: dayCueList.id,
        created_at: admin.firestore.Timestamp.fromDate(new Date(dayCueList.created_at)),
        updated_at: admin.firestore.Timestamp.fromDate(new Date(dayCueList.updated_at)),
        show_id: dayCueList.show_id,
        name: dayCueList.name,
        date: dayCueList.date,
        description: dayCueList.description || '',
        is_active: dayCueList.is_active || false,
        order_index: dayCueList.order_index || 0,
        metadata: dayCueList.metadata || {}
      });
    }
    
    await dayCueListBatch.commit();
    console.log(`Migrated ${dayCueLists.length} day cue lists`);
    
    // Migrate cues (may need to be done in batches if there are many)
    console.log('Migrating cues...');
    const { data: cues, error: cuesError } = await supabase.from('cues').select('*');
    
    if (cuesError) {
      throw new Error(`Error fetching cues: ${cuesError.message}`);
    }
    
    // Process cues in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < cues.length; i += batchSize) {
      const cueBatch = firestore.batch();
      const currentBatch = cues.slice(i, i + batchSize);
      
      for (const cue of currentBatch) {
        const cueRef = firestore.collection('cues').doc(cue.id);
        cueBatch.set(cueRef, {
          id: cue.id,
          created_at: admin.firestore.Timestamp.fromDate(new Date(cue.created_at)),
          updated_at: admin.firestore.Timestamp.fromDate(new Date(cue.updated_at)),
          day_cue_list_id: cue.day_cue_list_id,
          cue_number: cue.cue_number,
          display_id: cue.display_id || '',
          start_time: cue.start_time,
          run_time: cue.run_time,
          end_time: cue.end_time,
          activity: cue.activity,
          graphics: cue.graphics || '',
          video: cue.video || '',
          audio: cue.audio || '',
          lighting: cue.lighting || '',
          notes: cue.notes || '',
          previous_cue_id: cue.previous_cue_id || '',
          next_cue_id: cue.next_cue_id || '',
          cue_list_id: cue.day_cue_list_id // Redundant for easier querying
        });
      }
      
      await cueBatch.commit();
      console.log(`Migrated cues batch ${i/batchSize + 1} (${currentBatch.length} cues)`);
    }
    
    console.log(`Migrated ${cues.length} cues total`);
    
    // Migrate show collaborators
    console.log('Migrating show collaborators...');
    const { data: collaborators, error: collaboratorsError } = await supabase.from('show_collaborators').select('*');
    
    if (collaboratorsError) {
      throw new Error(`Error fetching show collaborators: ${collaboratorsError.message}`);
    }
    
    const collaboratorBatch = firestore.batch();
    for (const collaborator of collaborators) {
      const collaboratorRef = firestore.collection('show_collaborators').doc(collaborator.id);
      collaboratorBatch.set(collaboratorRef, {
        id: collaborator.id,
        created_at: admin.firestore.Timestamp.fromDate(new Date(collaborator.created_at)),
        show_id: collaborator.show_id,
        user_id: collaborator.user_id,
        email: collaborator.email,
        can_edit: collaborator.can_edit || false,
        token: collaborator.token || ''
      });
    }
    
    await collaboratorBatch.commit();
    console.log(`Migrated ${collaborators.length} show collaborators`);
    
    // Migrate files
    console.log('Migrating files...');
    const { data: files, error: filesError } = await supabase.from('files').select('*');
    
    if (filesError) {
      throw new Error(`Error fetching files: ${filesError.message}`);
    }
    
    const fileBatch = firestore.batch();
    for (const file of files) {
      const fileRef = firestore.collection('files').doc(file.id);
      fileBatch.set(fileRef, {
        id: file.id,
        created_at: admin.firestore.Timestamp.fromDate(new Date(file.created_at)),
        updated_at: admin.firestore.Timestamp.fromDate(new Date(file.updated_at)),
        name: file.name,
        file_type: file.file_type,
        storage_path: file.storage_path,
        size_bytes: file.size_bytes,
        metadata: file.metadata || {},
        show_id: file.show_id
      });
    }
    
    await fileBatch.commit();
    console.log(`Migrated ${files.length} files`);
    
    // Migrate show flows
    console.log('Migrating show flows...');
    const { data: flows, error: flowsError } = await supabase.from('show_flows').select('*');
    
    if (flowsError) {
      throw new Error(`Error fetching show flows: ${flowsError.message}`);
    }
    
    const flowBatch = firestore.batch();
    for (const flow of flows) {
      const flowRef = firestore.collection('show_flows').doc(flow.id);
      flowBatch.set(flowRef, {
        id: flow.id,
        created_at: admin.firestore.Timestamp.fromDate(new Date(flow.created_at)),
        updated_at: admin.firestore.Timestamp.fromDate(new Date(flow.updated_at)),
        show_id: flow.show_id,
        name: flow.name,
        description: flow.description || '',
        flow_data: flow.flow_data || { nodes: [], edges: [] },
        is_active: flow.is_active || false,
        version: flow.version || 1
      });
    }
    
    await flowBatch.commit();
    console.log(`Migrated ${flows.length} show flows`);
    
    console.log('\nCueFlow data migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();
