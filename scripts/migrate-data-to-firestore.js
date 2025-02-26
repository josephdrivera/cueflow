/**
 * Enhanced Supabase to Firebase Firestore Migration Script
 * 
 * This script exports data from Supabase and imports it into Firebase Firestore
 * following the optimized schema design for CueFlow app.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase Admin SDK
let serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account key not found at:', serviceAccountPath);
  console.error('Please generate a service account key from the Firebase console and save it as serviceAccountKey.json in the parent directory.');
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const firestore = admin.firestore();
const auth = admin.auth();

// Create a directory for temporary data storage
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Helper function to convert Supabase timestamp to Firestore timestamp
function toFirestoreTimestamp(supabaseTimestamp) {
  if (!supabaseTimestamp) return admin.firestore.FieldValue.serverTimestamp();
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
    console.error(`File not found: ${filePath}`);
    return null;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Data loaded from ${filePath}`);
  return data;
}

// Step 1: Export data from Supabase
async function exportFromSupabase() {
  console.log('Starting export from Supabase...');
  
  try {
    // Export users/profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }
    
    saveToTempFile('profiles.json', profiles);
    console.log(`Exported ${profiles.length} profiles`);
    
    // Export shows
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('*');
    
    if (showsError) {
      console.error('Error fetching shows:', showsError);
      throw showsError;
    }
    
    saveToTempFile('shows.json', shows);
    console.log(`Exported ${shows.length} shows`);
    
    // Export day cue lists
    const { data: dayCueLists, error: dayListsError } = await supabase
      .from('day_cue_lists')
      .select('*');
    
    if (dayListsError) {
      console.error('Error fetching day cue lists:', dayListsError);
      throw dayListsError;
    }
    
    saveToTempFile('day_cue_lists.json', dayCueLists);
    console.log(`Exported ${dayCueLists.length} day cue lists`);
    
    // Export cues
    const { data: cues, error: cuesError } = await supabase
      .from('cues')
      .select('*');
    
    if (cuesError) {
      console.error('Error fetching cues:', cuesError);
      throw cuesError;
    }
    
    saveToTempFile('cues.json', cues);
    console.log(`Exported ${cues.length} cues`);
    
    // Export collaborators
    const { data: collaborators, error: collabError } = await supabase
      .from('show_collaborators')
      .select('*');
    
    if (collabError) {
      console.error('Error fetching collaborators:', collabError);
      throw collabError;
    }
    
    saveToTempFile('collaborators.json', collaborators);
    console.log(`Exported ${collaborators.length} collaborators`);
    
    // Export invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*');
    
    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      throw invitationsError;
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
  } catch (error) {
    console.error('Failed to export data from Supabase:', error);
    throw error;
  }
}

// Step 2: Transform data to fit Firestore schema
function transformData(data) {
  console.log('Transforming data for Firestore...');
  
  if (!data) {
    console.error('No data to transform');
    return null;
  }
  
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
    settings: {
      theme: profile.settings?.theme || 'light',
      notifications: profile.settings?.notifications !== false
    }
  }));
  
  // Transform shows
  const transformedShows = shows.map(show => ({
    id: show.id, // Preserve original ID for reference
    title: show.title || '',
    description: show.description || '',
    creatorId: show.created_by || show.user_id || '',
    isPublished: show.is_published || false,
    isTemplate: show.is_template || false,
    status: show.status || 'draft',
    metadata: {
      venue: show.metadata?.venue || '',
      duration: show.metadata?.duration || '',
      ...show.metadata
    },
    createdAt: toFirestoreTimestamp(show.created_at),
    updatedAt: toFirestoreTimestamp(show.updated_at)
  }));
  
  // Transform day cue lists
  const transformedDayCueLists = dayCueLists.map(list => ({
    id: list.id, // Preserve original ID for reference
    showId: list.show_id,
    name: list.name || '',
    date: list.date || '',
    description: list.description || '',
    isActive: list.is_active !== false,
    orderIndex: list.order_index || 0,
    durationSeconds: list.duration_seconds || 0,
    metadata: list.metadata || {},
    createdAt: toFirestoreTimestamp(list.created_at),
    updatedAt: toFirestoreTimestamp(list.updated_at)
  }));
  
  // Transform cues
  const transformedCues = cues.map(cue => ({
    id: cue.id, // Preserve original ID for reference
    dayCueListId: cue.day_cue_list_id,
    showId: cue.show_id,
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
    id: collab.id, // Preserve original ID for reference
    showId: collab.show_id,
    userId: collab.user_id,
    canEdit: collab.can_edit !== false,
    createdAt: toFirestoreTimestamp(collab.created_at)
  }));
  
  // Transform invitations
  const transformedInvitations = invitations.map(invite => ({
    id: invite.id || uuidv4(), // Preserve original ID for reference
    showId: invite.show_id,
    email: invite.email || '',
    canEdit: invite.can_edit !== false,
    token: invite.token || uuidv4(),
    createdAt: toFirestoreTimestamp(invite.created_at),
    expiresAt: toFirestoreTimestamp(invite.expires_at) || 
               admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
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
  
  if (!data) {
    console.error('No data to import');
    return;
  }
  
  const { users, shows, dayCueLists, cues, collaborators, invitations } = data;
  
  try {
    // Import users
    console.log('Importing users...');
    const userBatches = [];
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const userChunk = users.slice(i, i + BATCH_SIZE);
      
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
    
    // Create a mapping of show IDs
    const showIdMap = {};
    shows.forEach(show => {
      showIdMap[show.id] = show.id; // Using same IDs for now
    });
    
    // Import shows and their subcollections
    console.log('Importing shows and related data...');
    for (const show of shows) {
      const showId = showIdMap[show.id];
      const showRef = firestore.collection('shows').doc(showId);
      
      // Create show document
      await showRef.set({
        title: show.title,
        description: show.description,
        creatorId: show.creatorId,
        isPublished: show.isPublished,
        isTemplate: show.isTemplate,
        status: show.status,
        metadata: show.metadata,
        createdAt: show.createdAt,
        updatedAt: show.updatedAt
      });
      
      console.log(`Imported show: ${show.title} (ID: ${showId})`);
      
      // Import day cue lists for this show
      const showDayCueLists = dayCueLists.filter(list => list.showId === show.id);
      
      for (const dayCueList of showDayCueLists) {
        const dayCueListId = dayCueList.id;
        const dayCueListRef = showRef.collection('dayCueLists').doc(dayCueListId);
        
        // Create day cue list document
        await dayCueListRef.set({
          name: dayCueList.name,
          date: dayCueList.date,
          description: dayCueList.description,
          isActive: dayCueList.isActive,
          orderIndex: dayCueList.orderIndex,
          durationSeconds: dayCueList.durationSeconds,
          metadata: dayCueList.metadata,
          createdAt: dayCueList.createdAt,
          updatedAt: dayCueList.updatedAt
        });
        
        // Import cues for this day cue list
        const dayCueCues = cues.filter(cue => cue.dayCueListId === dayCueList.id);
        
        // Use batching for cues
        const cueBatches = [];
        for (let i = 0; i < dayCueCues.length; i += BATCH_SIZE) {
          const batch = firestore.batch();
          const cueChunk = dayCueCues.slice(i, i + BATCH_SIZE);
          
          for (const cue of cueChunk) {
            const cueId = cue.id;
            const cueRef = dayCueListRef.collection('cues').doc(cueId);
            
            batch.set(cueRef, {
              cueNumber: cue.cueNumber,
              displayId: cue.displayId,
              startTime: cue.startTime,
              runTime: cue.runTime,
              endTime: cue.endTime,
              activity: cue.activity,
              graphics: cue.graphics,
              video: cue.video,
              audio: cue.audio,
              lighting: cue.lighting,
              notes: cue.notes,
              previousCueId: cue.previousCueId,
              nextCueId: cue.nextCueId,
              createdAt: cue.createdAt,
              updatedAt: cue.updatedAt
            });
          }
          
          cueBatches.push(batch);
        }
        
        for (let i = 0; i < cueBatches.length; i++) {
          await cueBatches[i].commit();
          console.log(`Committed cue batch ${i + 1}/${cueBatches.length} for day cue list: ${dayCueList.name}`);
        }
        
        console.log(`Imported ${dayCueCues.length} cues for day cue list: ${dayCueList.name}`);
      }
      
      // Import collaborators for this show
      const showCollaborators = collaborators.filter(collab => collab.showId === show.id);
      
      // Use batching for collaborators
      const collabBatches = [];
      for (let i = 0; i < showCollaborators.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        const collabChunk = showCollaborators.slice(i, i + BATCH_SIZE);
        
        for (const collaborator of collabChunk) {
          const collaboratorRef = showRef.collection('collaborators').doc(collaborator.userId);
          
          batch.set(collaboratorRef, {
            userId: collaborator.userId,
            canEdit: collaborator.canEdit,
            createdAt: collaborator.createdAt
          });
        }
        
        collabBatches.push(batch);
      }
      
      for (let i = 0; i < collabBatches.length; i++) {
        await collabBatches[i].commit();
        console.log(`Committed collaborator batch ${i + 1}/${collabBatches.length} for show: ${show.title}`);
      }
      
      console.log(`Imported ${showCollaborators.length} collaborators for show: ${show.title}`);
    }
    
    // Import invitations
    console.log('Importing invitations...');
    const invitationBatches = [];
    for (let i = 0; i < invitations.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const invitationChunk = invitations.slice(i, i + BATCH_SIZE);
      
      for (const invitation of invitationChunk) {
        const invitationId = invitation.id;
        const invitationRef = firestore.collection('invitations').doc(invitationId);
        
        batch.set(invitationRef, {
          showId: invitation.showId,
          email: invitation.email,
          canEdit: invitation.canEdit,
          token: invitation.token,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt
        });
      }
      
      invitationBatches.push(batch);
    }
    
    for (let i = 0; i < invitationBatches.length; i++) {
      await invitationBatches[i].commit();
      console.log(`Committed invitation batch ${i + 1}/${invitationBatches.length}`);
    }
    
    console.log('Import to Firestore completed successfully');
  } catch (error) {
    console.error('Error importing data to Firestore:', error);
    throw error;
  }
}

// Main migration function
async function migrateToFirestore() {
  try {
    console.log('Starting migration from Supabase to Firestore...');
    
    // Check if we have cached data
    let exportedData = readFromTempFile('all_data.json');
    
    if (!exportedData) {
      // Step 1: Export data from Supabase
      exportedData = await exportFromSupabase();
      saveToTempFile('all_data.json', exportedData);
    }
    
    // Step 2: Transform data to fit Firestore schema
    const transformedData = transformData(exportedData);
    
    // Step 3: Import data into Firestore
    await importToFirestore(transformedData);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateToFirestore();
