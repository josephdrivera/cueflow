# Setting Up Firebase for CueFlow

This guide walks you through setting up Firebase for your CueFlow application.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "CueFlow")
4. Choose whether to enable Google Analytics (recommended)
5. Follow the prompts to complete project creation

## 2. Enable Firestore

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (recommended)
4. Select a location for your Firestore database (choose a region close to your users)
5. Click "Enable"

## 3. Set Up Firebase Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the sign-in methods you want to use (at minimum, Email/Password)
4. Configure each sign-in method according to your requirements

## 4. Generate a Service Account Key

1. In your Firebase project console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Save the JSON file as `serviceAccountKey.json` in the parent directory of the scripts folder

## 5. Install Firebase in Your Project

1. Install the Firebase SDK:

```bash
npm install firebase
```

2. Install Firebase Admin SDK (for server-side operations):

```bash
npm install firebase-admin
```

## 6. Initialize Firebase in Your Application

Create a file called `src/lib/firebase.js` with the following content:

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
```

## 7. Create Environment Variables

Create or update your `.env.local` file with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

You can find these values in your Firebase project settings.

## 8. Set Up Firestore Schema

You have two options for setting up the Firestore schema:

### Option 1: Use the setup-schema script (Basic schema)

```bash
cd scripts
npm install
npm run setup-schema
```

### Option 2: Use the create-schema script (Comprehensive schema with sample data)

This script creates a more comprehensive schema with sample data that demonstrates the full structure:

```bash
cd scripts
npm install
npm run create-schema
```

The script will create the necessary collections and sample documents in your Firestore database. You can view the complete schema documentation in `scripts/FIRESTORE_SCHEMA.md`.

To remove the sample data after reviewing the schema:

```bash
npm run cleanup-schema
```

## 9. Migrate Data from Supabase to Firestore

If you have existing data in Supabase that you want to migrate to Firestore, follow these steps:

1. Make sure your Supabase environment variables are set in the `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. Run the migration script:

```bash
cd scripts
npm install
npm run migrate-data
```

This script will:
- Export data from your Supabase database
- Transform it to match the Firestore schema
- Import it into your Firestore database
- Save temporary files in a `temp` directory for reference

3. After verifying that your data has been successfully migrated, you can update your application code to use Firestore instead of Supabase.

## 10. Deploy Firestore Rules

1. Install the Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase in your project:

```bash
firebase init
```

4. Select "Firestore" when prompted for which features to set up
5. Choose your Firebase project
6. Accept the default file for Firestore Rules (`firestore.rules`)
7. Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

## Next Steps

1. Update your application code to use Firestore instead of Supabase
2. Test your application to ensure everything works correctly
3. Consider setting up Firebase Hosting if you want to host your application on Firebase
