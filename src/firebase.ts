import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase with the auto-provisioned configuration
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const auth = getAuth(app);

// Use custom named database if provisioned in configuration
const dbId = firebaseConfig.firestoreDatabaseId;
const settings = {
  experimentalForceLongPolling: true,
};

export const db = dbId && dbId !== '(default)'
  ? initializeFirestore(app, settings, dbId)
  : initializeFirestore(app, settings);

export default app;
