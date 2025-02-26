# CueFlow Data Migration Guide

This guide explains how to migrate your data from Supabase to Firebase Firestore for the CueFlow application.

## Prerequisites

Before running the migration script, make sure you have:

1. A Firebase project set up with Firestore enabled
2. A service account key file (`serviceAccountKey.json`) placed in the parent directory
3. Supabase credentials in your `.env` file
4. Node.js installed on your machine

## Migration Process

The migration script handles the following tasks:

1. **Export Data from Supabase**: Extracts all relevant data from your Supabase database
2. **Transform Data**: Converts the data structure to match the Firestore schema
3. **Import to Firestore**: Imports the transformed data into your Firestore database

## Schema Mapping

The script maps the Supabase schema to the following Firestore structure:

### Users Collection
```
users/
  {userId}/
    uid: string
    email: string
    username: string
    fullName: string
    avatarUrl: string
    createdAt: timestamp
    updatedAt: timestamp
    settings: {
      theme: string
      notifications: boolean
    }
```

### Shows Collection
```
shows/
  {showId}/
    title: string
    description: string
    creatorId: string
    isPublished: boolean
    isTemplate: boolean
    status: string
    metadata: {
      venue: string
      duration: string
      ...
    }
    createdAt: timestamp
    updatedAt: timestamp
    
    dayCueLists/ (subcollection)
      {dayCueListId}/
        name: string
        date: string
        description: string
        isActive: boolean
        orderIndex: number
        durationSeconds: number
        metadata: object
        createdAt: timestamp
        updatedAt: timestamp
        
        cues/ (subcollection)
          {cueId}/
            cueNumber: string
            displayId: string
            startTime: string
            runTime: string
            endTime: string
            activity: string
            graphics: string
            video: string
            audio: string
            lighting: string
            notes: string
            previousCueId: string
            nextCueId: string
            createdAt: timestamp
            updatedAt: timestamp
    
    collaborators/ (subcollection)
      {userId}/
        userId: string
        canEdit: boolean
        createdAt: timestamp
```

### Invitations Collection
```
invitations/
  {invitationId}/
    showId: string
    email: string
    canEdit: boolean
    token: string
    createdAt: timestamp
    expiresAt: timestamp
```

## Running the Migration

1. Navigate to the scripts directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the migration script:
   ```
   npm run migrate-data
   ```

4. Check the console output for progress and any errors

## Troubleshooting

- **Missing Environment Variables**: Ensure your `.env` file contains the necessary Supabase credentials
- **Service Account Key Not Found**: Make sure you've placed the `serviceAccountKey.json` file in the parent directory
- **Batch Size Errors**: If you encounter batch size errors, the script automatically handles batching for large datasets
- **Temporary Files**: The script saves temporary JSON files in a `temp` directory, which can be useful for debugging

## Post-Migration

After successfully migrating your data:

1. Update your application code to use Firebase instead of Supabase
2. Test your application thoroughly to ensure all functionality works with the new database
3. Consider setting up Firebase Authentication to match your user accounts

## Data Verification

To verify your data has been migrated correctly:

1. Check the Firebase Console to view your imported data
2. Compare record counts between Supabase and Firestore
3. Test critical application features to ensure they work with the migrated data
