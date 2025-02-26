# CueFlow Migration Guide

This guide provides instructions for migrating the CueFlow application from Supabase to Firebase Firestore.

## Prerequisites

1. Node.js and npm installed
2. Firebase project created
3. Firestore database enabled in your Firebase project
4. Service account key from Firebase (saved as `serviceAccountKey.json` in the parent directory)
5. Supabase project with existing data

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the `scripts` directory with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

## Schema Setup

The schema setup script creates the necessary collections and sample documents in Firestore based on the Supabase schema.

### Create Schema

Run the following command to create the schema with sample data:

```
npm run create-cueflow-schema
```

This will create the following collections:
- profiles
- shows
- day_cue_lists
- cues
- show_collaborators
- files
- show_flows

### Clean Up Sample Data

If you want to remove the sample data after reviewing the schema:

```
npm run cleanup-cueflow-schema
```

## Data Migration

The data migration script transfers your actual data from Supabase to Firestore.

### Migrate Data

Run the following command to migrate your data:

```
npm run migrate-cueflow-data
```

This will:
1. Fetch all data from Supabase tables
2. Transform the data to match the Firestore schema
3. Write the data to Firestore collections
4. Preserve all relationships between entities

## Schema Structure

The CueFlow Firestore schema consists of the following collections:

1. **profiles** - User profiles
2. **shows** - Theater productions
3. **day_cue_lists** - Lists of cues for specific show days
4. **cues** - Individual cues within a day cue list
5. **show_collaborators** - Collaborators for shows
6. **files** - Files associated with shows
7. **show_flows** - Flow diagrams for shows

For detailed schema information, see [CUEFLOW_SCHEMA.md](./CUEFLOW_SCHEMA.md).

## Migration Considerations

### Data Integrity

- All IDs from Supabase are preserved to maintain relationships
- Timestamps are converted from Supabase format to Firestore timestamps
- Default values are provided for missing fields

### Performance

- Large collections (like cues) are migrated in batches to avoid Firestore limits
- The migration process may take some time depending on the amount of data

### Post-Migration Steps

After migration, you should:

1. Verify that all data has been migrated correctly
2. Update your application code to use Firestore instead of Supabase
3. Test your application thoroughly with the migrated data
4. Set up appropriate Firestore security rules

## Troubleshooting

### Common Issues

1. **Service Account Key Missing**
   
   Error: `Service account key not found`
   
   Solution: Make sure you have placed your `serviceAccountKey.json` file in the parent directory.

2. **Supabase Credentials Missing**
   
   Error: `Supabase URL and service key must be provided in .env file`
   
   Solution: Create a `.env` file with your Supabase credentials.

3. **Batch Write Errors**
   
   Error: `Error during migration: FirebaseError: ...`
   
   Solution: Check the specific error message. You might need to adjust batch sizes or fix data formatting issues.

### Getting Help

If you encounter issues not covered here, please:

1. Check the Firebase and Supabase documentation
2. Review your data structure in Supabase
3. Verify your Firebase project settings
4. Reach out to the CueFlow development team for assistance

## Next Steps

After successful migration:

1. Update your application to use Firebase Authentication
2. Implement Firestore security rules
3. Update your application code to use Firestore queries
4. Consider implementing Firebase Cloud Functions for backend logic
