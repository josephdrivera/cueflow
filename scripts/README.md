# CueFlow Firestore Schema Setup

This repository contains scripts to set up the Firebase Firestore schema for the CueFlow application.

## Prerequisites

1. Node.js installed on your machine
2. A Firebase project with Firestore enabled
3. Firebase service account key

## Setup

1. **Install dependencies**

```bash
cd scripts
npm install
```

2. **Create a Firebase service account key**

- Go to your Firebase project settings
- Navigate to "Service accounts" tab
- Click "Generate new private key"
- Save the JSON file as `serviceAccountKey.json` in the parent directory of this scripts folder

## Setting Up the Firestore Schema

Since you don't have any data in Supabase yet, you can directly set up the Firestore schema structure:

```bash
npm run setup-schema
```

This script will:

1. Create the necessary collections and subcollections in Firestore
2. Add sample documents to demonstrate the schema structure
3. Set up the relationships between documents

## Sample Data

The setup script creates sample data to demonstrate the schema structure:

- A sample user
- A sample show with metadata
- A sample day cue list
- Sample cues with relationships
- A sample collaborator
- A sample invitation

You can keep this sample data for reference or delete it using:

```bash
npm run cleanup-samples
```

## Schema Structure

The Firestore schema follows this structure:

### 1. Users Collection
```
/users/{userId}
```

### 2. Shows Collection
```
/shows/{showId}
```

### 3. Day Cue Lists Subcollection
```
/shows/{showId}/dayCueLists/{dayCueListId}
```

### 4. Cues Subcollection
```
/shows/{showId}/dayCueLists/{dayCueListId}/cues/{cueId}
```

### 5. Collaborators Subcollection
```
/shows/{showId}/collaborators/{userId}
```

### 6. Invitations Collection
```
/invitations/{invitationId}
```

## Migration Script (If Needed Later)

If you later need to migrate data from Supabase to Firestore, you can use:

```bash
npm run migrate
```

This script will:
1. Export data from Supabase
2. Transform the data to fit the Firestore schema
3. Import the data into Firestore

## Troubleshooting

- If the setup fails, check the error message in the console
- Ensure your Firebase credentials are correct
- Verify that your Firebase service account has the necessary permissions
