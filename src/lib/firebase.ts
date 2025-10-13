import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kilangdm-v1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kilangdm-v1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kilangdm-v1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "264191193800",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:264191193800:web:0f3d9f25b9694c16bdabfd",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-C02S0CPE63"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Initialize analytics only on client side
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

export { app, db, analytics };
