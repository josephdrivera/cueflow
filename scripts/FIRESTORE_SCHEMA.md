# Firestore Schema for CueFlow

This document outlines the Firestore database schema for the CueFlow application.

## Schema Overview

The CueFlow Firestore schema is designed as a hierarchical structure with collections and subcollections to represent the relationships between different entities.

### Collections Structure

```
users/
  {userId}/
    ...user data

shows/
  {showId}/
    ...show data
    
    dayCueLists/ (subcollection)
      {dayCueListId}/
        ...day cue list data
        
        cues/ (subcollection)
          {cueId}/
            ...cue data
    
    collaborators/ (subcollection)
      {userId}/
        ...collaborator data

invitations/
  {invitationId}/
    ...invitation data
```

## Collection Details

### 1. Users Collection

The `users` collection stores user profiles and preferences.

```
users/
  {userId}/
    uid: string           // User ID (same as document ID)
    email: string         // User's email address
    username: string      // User's chosen username
    fullName: string      // User's full name
    avatarUrl: string     // URL to user's profile image
    createdAt: timestamp  // When the user was created
    updatedAt: timestamp  // When the user was last updated
    settings: {           // User preferences
      theme: string       // UI theme preference (light/dark)
      notifications: boolean // Notification preferences
    }
```

### 2. Shows Collection

The `shows` collection contains all show data and has subcollections for day cue lists and collaborators.

```
shows/
  {showId}/
    title: string         // Show title
    description: string   // Show description
    creatorId: string     // ID of the user who created the show
    isPublished: boolean  // Whether the show is published
    isTemplate: boolean   // Whether the show is a template
    status: string        // Show status (draft, published, archived)
    metadata: {           // Custom metadata for the show
      venue: string       // Venue name
      duration: string    // Show duration
      ...                 // Other custom fields
    }
    createdAt: timestamp  // When the show was created
    updatedAt: timestamp  // When the show was last updated
```

### 3. Day Cue Lists Subcollection

Each show has a subcollection of day cue lists.

```
shows/{showId}/dayCueLists/
  {dayCueListId}/
    name: string          // Name of the day cue list
    date: string          // Date for this cue list
    description: string   // Description of this cue list
    isActive: boolean     // Whether this cue list is active
    orderIndex: number    // Order in which to display this cue list
    durationSeconds: number // Total duration in seconds
    metadata: map         // Additional metadata
    createdAt: timestamp  // When the cue list was created
    updatedAt: timestamp  // When the cue list was last updated
```

### 4. Cues Subcollection

Each day cue list has a subcollection of cues.

```
shows/{showId}/dayCueLists/{dayCueListId}/cues/
  {cueId}/
    cueNumber: string     // Cue number (e.g., "1.0", "1.5")
    displayId: string     // Display ID for the cue
    startTime: string     // Start time (HH:MM:SS)
    runTime: string       // Run time duration (HH:MM:SS)
    endTime: string       // End time (HH:MM:SS)
    activity: string      // Main activity description
    graphics: string      // Graphics notes
    video: string         // Video notes
    audio: string         // Audio notes
    lighting: string      // Lighting notes
    notes: string         // Additional notes
    previousCueId: string // ID of the previous cue
    nextCueId: string     // ID of the next cue
    createdAt: timestamp  // When the cue was created
    updatedAt: timestamp  // When the cue was last updated
```

### 5. Collaborators Subcollection

Each show has a subcollection of collaborators who have access to the show.

```
shows/{showId}/collaborators/
  {userId}/
    userId: string        // User ID of the collaborator
    canEdit: boolean      // Whether the collaborator can edit the show
    createdAt: timestamp  // When the collaborator was added
```

### 6. Invitations Collection

The `invitations` collection stores invitations to collaborate on shows.

```
invitations/
  {invitationId}/
    showId: string        // ID of the show
    email: string         // Email address of the invitee
    canEdit: boolean      // Whether the invitee will have edit permissions
    token: string         // Unique token for the invitation
    createdAt: timestamp  // When the invitation was created
    expiresAt: timestamp  // When the invitation expires
```

## Security Rules

The Firestore security rules enforce the following permissions:

1. Users can read and write their own data
2. Shows can be read by their creator and collaborators
3. Shows can only be edited by their creator or collaborators with edit permissions
4. Day cue lists and cues inherit permissions from their parent show
5. Collaborators can be managed only by the show creator
6. Invitations can be read by the creator of the associated show

## Schema Setup Script

The `create-firestore-schema.js` script sets up this schema structure with sample data to demonstrate the relationships and data types.

### Running the Script

1. Make sure you have a Firebase project set up with Firestore enabled
2. Place your `serviceAccountKey.json` file in the parent directory
3. Run the script:

```bash
cd scripts
npm install
npm run create-schema
```

### Cleaning Up Sample Data

To remove the sample data after reviewing the schema:

```bash
npm run cleanup-schema
```

## Best Practices

1. **Querying**: When querying subcollections, use collection group queries for cross-show searches
2. **Indexing**: Create composite indexes for frequently used queries
3. **References**: Use document references for relationships between documents
4. **Transactions**: Use transactions when updating related documents to maintain consistency
5. **Batched Writes**: Use batched writes when creating or updating multiple documents

## Schema Evolution

As the application evolves, you may need to update the schema. Consider the following approaches:

1. **Adding Fields**: Simply add new fields to documents (Firestore is schemaless)
2. **Renaming Fields**: Create a migration script to update all documents
3. **Restructuring**: Use a phased approach with temporary duplication of data during migration
