# CueFlow: Firebase Migration Plan

## Current State
The application appears to be mid-migration from Supabase to Firebase, with some components still referencing Supabase while others use Firebase.

## Migration Steps

### 1. Authentication
- [x] Set up Firebase Authentication (basic setup appears complete)
- [ ] Replace all Supabase auth calls with Firebase equivalents
- [ ] Update session handling in middleware.ts
- [ ] Test auth flow: login, logout, password reset, email verification

### 2. Database
- [ ] Complete migration of collections in Firestore
- [ ] Replace all Supabase database calls with Firestore equivalents
- [ ] Ensure real-time subscription functionality works with Firestore

### 3. Firebase Rules
- [ ] Set up proper security rules in Firebase for collections:
  - Shows
  - Cues
  - User profiles
  - Collaborator invitations

### 4. Update Service Layer
- [ ] Refactor cueService.ts to use Firebase exclusively
- [ ] Refactor showService.ts to use Firebase exclusively
- [ ] Create consistent error handling for Firebase operations

### 5. Middleware
- [ ] Update middleware to use Firebase Admin SDK for verification
- [ ] Ensure protected routes require authentication

### 6. Client Components
- [ ] Update all components to use Firebase hooks and methods
- [ ] Remove Supabase imports and references
- [ ] Test all CRUD operations with Firebase

### 7. Environment Variables
- [ ] Ensure all Firebase environment variables are properly set
- [ ] Remove Supabase environment variables

### 8. Testing Checklist
- [ ] User signup and verification flows
- [ ] User login and session management
- [ ] Show creation, editing, and deletion
- [ ] Cue management and ordering
- [ ] Collaboration features
- [ ] User settings and preferences

## Priority Files for Immediate Updates

1. `src/lib/supabase.ts` → Replace with Firebase initialization
2. Any component directly using `supabase.from()`
3. Authentication components in `/src/components/auth/`
4. Middleware.ts for session handling

## Notes on Firebase Admin
- Firebase Admin SDK should only be used in server-side code
- Create proper separation between client and server usage of Firebase
