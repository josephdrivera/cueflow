// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPtTGy3vNh-2Zbu6-jvNmXszuDQEQC4dA",
  authDomain: "showsync-da6d8.firebaseapp.com",
  projectId: "showsync-da6d8",
  storageBucket: "showsync-da6d8.firebasestorage.app",
  messagingSenderId: "581405152333",
  appId: "1:581405152333:web:b958c45e12d3f524233804"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development environment
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you're using Firebase emulators
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
}

// Export the Firebase services
export { app, auth, db, storage };
