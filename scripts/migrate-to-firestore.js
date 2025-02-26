/**
 * Supabase to Firebase Firestore Migration Script
 * 
 * This script exports data from Supabase and imports it into Firebase Firestore
 * following the schema design for CueFlow app.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase Admin SDK
// You need to provide your own service account key
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const auth = admin.auth();

// Create a directory for temporary data storage
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Helper function to convert Supabase timestamp to Firestore timestamp
function toFirestoreTimestamp(supabaseTimestamp) {
  if (!supabaseTimestamp) return null;
  return admin.firestore.Timestamp.fromDate(new Date(supabaseTimestamp));
}

// Helper function to save data to a temporary JSON file
function saveToTempFile(filename, data) {
  const filePath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
  return filePath;
}

// Helper function to read data from a temporary JSON file
function readFromTempFile(filename) {
  const filePath = path.join(TEMP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} does not exist`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Step 1: Export data from Supabase
async function exportFromSupabase() {
  console.log('Starting export from Supabase...');
  
  // Export users/profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }
  
  saveToTempFile('profiles.json', profiles);
  console.log(`Exported ${profiles.length} profiles`);
  
  // Export shows
  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select('*');
  
  if (showsError) {
    console.error('Error fetching shows:', showsError);
    return;
  }
  
  saveToTempFile('shows.json', shows);
  console.log(`Exported ${shows.length} shows`);
  
  // Export day cue lists
  const { data: dayCueLists, error: dayListsError } = await supabase
    .from('day_cue_lists')
    .select('*');
  
  if (dayListsError) {
    console.error('Error fetching day cue lists:', dayListsError);
    return;
  }
  
  saveToTempFile('day_cue_lists.json', dayCueLists);
  console.log(`Exported ${dayCueLists.length} day cue lists`);
  
  // Export cues
  const { data: cues, error: cuesError } = await supabase
    .from('cues')
    .select('*');
  
  if (cuesError) {
    console.error('Error fetching cues:', cuesError);
    return;
  }
  
  saveToTempFile('cues.json', cues);
  console.log(`Exported ${cues.length} cues`);
  
  // Export collaborators
  const { data: collaborators, error: collabError } = await supabase
    .from('show_collaborators')
    .select('*');
  
  if (collabError) {
    console.error('Error fetching collaborators:', collabError);
    return;
  }
  
  saveToTempFile('collaborators.json', collaborators);
  console.log(`Exported ${collaborators.length} collaborators`);
  
  // Export invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('invitations')
    .select('*');
  
  if (invitationsError) {
    console.error('Error fetching invitations:', invitationsError);
    return;
  }
  
  saveToTempFile('invitations.json', invitations);
  console.log(`Exported ${invitations.length} invitations`);
  
  console.log('Export from Supabase completed successfully');
  return {
    profiles,
    shows,
    dayCueLists,
    cues,
    collaborators,
    invitations
  };
}

// Step 2: Transform data to fit Firestore schema
function transformData(data) {
  console.log('Transforming data for Firestore...');
  
  const { profiles, shows, dayCueLists, cues, collaborators, invitations } = data;
  
  // Transform profiles to users
  const users = profiles.map(profile => ({
    uid: profile.id,
    email: profile.email || '',
    username: profile.username || '',
    fullName: profile.full_name || '',
    avatarUrl: profile.avatar_url || '',
    createdAt: toFirestoreTimestamp(profile.created_at),
    updatedAt: toFirestoreTimestamp(profile.updated_at),
    settings: profile.settings || {}
  }));
  
  // Transform shows
  const transformedShows = shows.map(show => ({
    title: show.title || '',
    description: show.description || '',
    creatorId: show.created_by || show.user_id || '',
    isTemplate: show.is_template || false,
    metadata: show.metadata || {},
    createdAt: toFirestoreTimestamp(show.created_at),
    updatedAt: toFirestoreTimestamp(show.updated_at)
  }));
  
  // Transform day cue lists
  const transformedDayCueLists = dayCueLists.map(list => ({
    showId: list.show_id,
    name: list.name || '',
    date: list.date || '',
    description: list.description || '',
    isActive: list.is_active || true,
    createdAt: toFirestoreTimestamp(list.created_at),
    updatedAt: toFirestoreTimestamp(list.updated_at)
  }));
  
  // Transform cues
  const transformedCues = cues.map(cue => ({
    dayCueListId: cue.day_cue_list_id,
    cueNumber: cue.cue_number || '',
    displayId: cue.display_id || '',
    startTime: cue.start_time || '',
    runTime: cue.run_time || '',
    endTime: cue.end_time || '',
    activity: cue.activity || '',
    graphics: cue.graphics || '',
    video: cue.video || '',
    audio: cue.audio || '',
    lighting: cue.lighting || '',
    notes: cue.notes || '',
    previousCueId: cue.previous_cue_id || '',
    nextCueId: cue.next_cue_id || '',
    createdAt: toFirestoreTimestamp(cue.created_at),
    updatedAt: toFirestoreTimestamp(cue.updated_at)
  }));
  
  // Transform collaborators
  const transformedCollaborators = collaborators.map(collab => ({
    showId: collab.show_id,
    userId: collab.user_id,
    canEdit: collab.can_edit || false,
    createdAt: toFirestoreTimestamp(collab.created_at)
  }));
  
  // Transform invitations
  const transformedInvitations = invitations.map(invite => ({
    showId: invite.show_id,
    email: invite.email || '',
    canEdit: invite.can_edit || false,
    token: invite.token || '',
    createdAt: toFirestoreTimestamp(invite.created_at),
    expiresAt: toFirestoreTimestamp(invite.expires_at)
  }));
  
  const transformedData = {
    users,
    shows: transformedShows,
    dayCueLists: transformedDayCueLists,
    cues: transformedCues,
    collaborators: transformedCollaborators,
    invitations: transformedInvitations
  };
  
  saveToTempFile('transformed_data.json', transformedData);
  console.log('Data transformation completed');
  
  return transformedData;
}

// Step 3: Import data into Firestore
async function importToFirestore(data) {
  console.log('Starting import to Firestore...');
  
  const { users, shows, dayCueLists, cues, collaborators, invitations } = data;
  
  // Create a batch for users
  console.log('Importing users...');
  const userBatches = [];
  for (let i = 0; i < users.length; i += 500) {
    const batch = firestore.batch();
    const userChunk = users.slice(i, i + 500);
    
    for (const user of userChunk) {
      const userRef = firestore.collection('users').doc(user.uid);
      batch.set(userRef, user);
    }
    
    userBatches.push(batch);
  }
  
  for (let i = 0; i < userBatches.length; i++) {
    await userBatches[i].commit();
    console.log(`Committed user batch ${i + 1}/${userBatches.length}`);
  }
  
  // Import shows and their subcollections
  console.log('Importing shows and related data...');
  for (const show of shows) {
    const showId = show.id;
    const showRef = firestore.collection('shows').doc(showId);
    
    // Create show document
    await showRef.set(show);
    console.log(`Imported show: ${show.title}`);
    
    // Import day cue lists for this show
    const showDayCueLists = dayCueLists.filter(list => list.showId === showId);
    for (const dayCueList of showDayCueLists) {
      const dayCueListId = dayCueList.id;
      const dayCueListRef = showRef.collection('dayCueLists').doc(dayCueListId);
      
      // Create day cue list document
      await dayCueListRef.set(dayCueList);
      
      // Import cues for this day cue list
      const dayCueCues = cues.filter(cue => cue.dayCueListId === dayCueListId);
      for (const cue of dayCueCues) {
        const cueId = cue.id;
        const cueRef = dayCueListRef.collection('cues').doc(cueId);
        
        // Create cue document
        await cueRef.set(cue);
      }
      
      console.log(`Imported ${dayCueCues.length} cues for day cue list: ${dayCueList.name}`);
    }
    
    // Import collaborators for this show
    const showCollaborators = collaborators.filter(collab => collab.showId === showId);
    for (const collaborator of showCollaborators) {
      const collaboratorRef = showRef.collection('collaborators').doc(collaborator.userId);
      
      // Create collaborator document
      await collaboratorRef.set(collaborator);
    }
    
    console.log(`Imported ${showCollaborators.length} collaborators for show: ${show.title}`);
  }
  
  // Import invitations
  console.log('Importing invitations...');
  const invitationBatches = [];
  for (let i = 0; i < invitations.length; i += 500) {
    const batch = firestore.batch();
    const invitationChunk = invitations.slice(i, i + 500);
    
    for (const invitation of invitationChunk) {
      const invitationId = invitation.id;
      const invitationRef = firestore.collection('invitations').doc(invitationId);
      batch.set(invitationRef, invitation);
    }
    
    invitationBatches.push(batch);
  }
  
  for (let i = 0; i < invitationBatches.length; i++) {
    await invitationBatches[i].commit();
    console.log(`Committed invitation batch ${i + 1}/${invitationBatches.length}`);
  }
  
  console.log('Import to Firestore completed successfully');
}

// Main migration function
async function migrateToFirestore() {
  try {
    console.log('Starting migration from Supabase to Firestore...');
    
    // Step 1: Export data from Supabase
    const exportedData = await exportFromSupabase();
    
    // Step 2: Transform data to fit Firestore schema
    const transformedData = transformData(exportedData);
    
    // Step 3: Import data into Firestore
    await importToFirestore(transformedData);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateToFirestore();
