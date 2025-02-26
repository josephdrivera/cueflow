# CueFlow Firestore Schema Documentation

This document outlines the Firestore schema structure for the CueFlow application, based on the existing Supabase schema.

## Schema Overview

The CueFlow database consists of the following main collections:

1. **profiles** - User profiles
2. **shows** - Theater productions
3. **day_cue_lists** - Lists of cues for specific show days
4. **cues** - Individual cues within a day cue list
5. **show_collaborators** - Collaborators for shows
6. **files** - Files associated with shows
7. **show_flows** - Flow diagrams for shows

## Collection Details

### profiles

Stores user profile information.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the profile |
| updated_at | timestamp | Last update timestamp |
| username | string | User's username |
| full_name | string | User's full name |
| avatar_url | string | URL to user's avatar image |
| role | string | User's role (admin, user, etc.) |

### shows

Stores information about theater productions.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the show |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| title | string | Show title |
| description | string | Show description |
| created_by | string | ID of the user who created the show |
| is_template | boolean | Whether this show is a template |
| is_archived | boolean | Whether this show is archived |
| user_id | string | ID of the user who owns the show |
| metadata | map | Additional custom metadata for the show |

### day_cue_lists

Stores cue lists for specific days of a show.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the day cue list |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| show_id | string | ID of the show this day cue list belongs to |
| name | string | Name of the day cue list |
| date | string | Date of the day cue list (YYYY-MM-DD) |
| description | string | Description of the day cue list |
| is_active | boolean | Whether this day cue list is active |
| order_index | number | Order index for sorting |
| metadata | map | Additional custom metadata for the day cue list |

### cues

Stores individual cues within a day cue list.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the cue |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| day_cue_list_id | string | ID of the day cue list this cue belongs to |
| cue_number | string | Cue number (e.g., "1.0", "2.5") |
| display_id | string | Display identifier for the cue |
| start_time | string | Start time of the cue (HH:MM:SS) |
| run_time | string | Run time of the cue (HH:MM:SS) |
| end_time | string | End time of the cue (HH:MM:SS) |
| activity | string | Main activity description |
| graphics | string | Graphics notes |
| video | string | Video notes |
| audio | string | Audio notes |
| lighting | string | Lighting notes |
| notes | string | General notes |
| previous_cue_id | string | ID of the previous cue |
| next_cue_id | string | ID of the next cue |
| cue_list_id | string | ID of the day cue list (redundant for queries) |

### show_collaborators

Stores collaborators for shows.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the collaborator |
| created_at | timestamp | Creation timestamp |
| show_id | string | ID of the show |
| user_id | string | ID of the user collaborator |
| email | string | Email of the collaborator |
| can_edit | boolean | Whether the collaborator can edit the show |
| token | string | Access token for the collaborator |

### files

Stores files associated with shows.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the file |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| name | string | File name |
| file_type | string | MIME type of the file |
| storage_path | string | Path to the file in storage |
| size_bytes | number | Size of the file in bytes |
| metadata | map | Additional metadata for the file |
| show_id | string | ID of the show this file belongs to |

### show_flows

Stores flow diagrams for shows.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the flow |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| show_id | string | ID of the show this flow belongs to |
| name | string | Name of the flow |
| description | string | Description of the flow |
| flow_data | map | Flow data including nodes and edges |
| is_active | boolean | Whether this flow is active |
| version | number | Version number of the flow |

## Data Relationships

- **shows** ← **profiles**: A show is created by a user profile
- **day_cue_lists** ← **shows**: A day cue list belongs to a show
- **cues** ← **day_cue_lists**: A cue belongs to a day cue list
- **show_collaborators** ← **shows**: A collaborator is associated with a show
- **files** ← **shows**: A file is associated with a show
- **show_flows** ← **shows**: A flow is associated with a show

## Querying Patterns

### Common Queries

1. Get all shows for a user:
   ```javascript
   firestore.collection('shows').where('user_id', '==', 'user-id').get()
   ```

2. Get all day cue lists for a show:
   ```javascript
   firestore.collection('day_cue_lists').where('show_id', '==', 'show-id').get()
   ```

3. Get all cues for a day cue list:
   ```javascript
   firestore.collection('cues').where('day_cue_list_id', '==', 'day-cue-list-id').get()
   ```

4. Get all collaborators for a show:
   ```javascript
   firestore.collection('show_collaborators').where('show_id', '==', 'show-id').get()
   ```

## Security Rules

Here are recommended Firestore security rules for this schema:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profile rules
    match /profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == profileId;
    }
    
    // Show rules
    match /shows/{showId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.user_id || 
                            exists(/databases/$(database)/documents/show_collaborators/$(showId)_$(request.auth.uid));
    }
    
    // Day cue list rules
    match /day_cue_lists/{listId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/shows/$(resource.data.show_id)).data.user_id == request.auth.uid || 
                   exists(/databases/$(database)/documents/show_collaborators/$(resource.data.show_id)_$(request.auth.uid)));
    }
    
    // Cue rules
    match /cues/{cueId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/day_cue_lists/$(resource.data.day_cue_list_id)).data.show_id == 
                   get(/databases/$(database)/documents/shows/$(get(/databases/$(database)/documents/day_cue_lists/$(resource.data.day_cue_list_id)).data.show_id)).data.user_id || 
                   exists(/databases/$(database)/documents/show_collaborators/$(get(/databases/$(database)/documents/day_cue_lists/$(resource.data.day_cue_list_id)).data.show_id)_$(request.auth.uid)));
    }
    
    // Collaborator rules
    match /show_collaborators/{collaboratorId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                    get(/databases/$(database)/documents/shows/$(request.resource.data.show_id)).data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
                           get(/databases/$(database)/documents/shows/$(resource.data.show_id)).data.user_id == request.auth.uid;
    }
    
    // File rules
    match /files/{fileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/shows/$(resource.data.show_id)).data.user_id == request.auth.uid || 
                   exists(/databases/$(database)/documents/show_collaborators/$(resource.data.show_id)_$(request.auth.uid)));
    }
    
    // Show flow rules
    match /show_flows/{flowId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/shows/$(resource.data.show_id)).data.user_id == request.auth.uid || 
                   exists(/databases/$(database)/documents/show_collaborators/$(resource.data.show_id)_$(request.auth.uid)));
    }
  }
}
```

## Best Practices

1. **Use Transactions**: When updating related documents (e.g., updating a cue and its neighbors), use transactions to ensure consistency.

2. **Denormalize When Necessary**: Some fields are denormalized for query efficiency (e.g., `cue_list_id` in the `cues` collection).

3. **Composite IDs**: For many-to-many relationships, consider using composite IDs (e.g., `$(showId)_$(userId)` for collaborators).

4. **Pagination**: When querying large collections, use pagination to limit the amount of data retrieved.

5. **Indexing**: Create composite indexes for frequently used queries to improve performance.

## Migration Considerations

When migrating from Supabase to Firestore:

1. Preserve original IDs when possible to maintain references.
2. Convert PostgreSQL timestamps to Firestore timestamps.
3. Denormalize data where appropriate for Firestore's document-based model.
4. Update security rules to match your application's permission model.
5. Test thoroughly with a subset of data before full migration.
