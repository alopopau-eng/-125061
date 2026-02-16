
// This is a placeholder for your actual Firebase configuration.
// Ensure you have initialized your firebase app elsewhere or here.
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  Firestore
} from "firebase/firestore";

// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC2zL7ozRgQ9mEAY_1IFYkweHnDa86iamw",
  authDomain: "macdonakds-eb8e7.firebaseapp.com",
  databaseURL: "https://macdonakds-eb8e7-default-rtdb.firebaseio.com",
  projectId: "macdonakds-eb8e7",
  storageBucket: "macdonakds-eb8e7.firebasestorage.app",
  messagingSenderId: "135484060912",
  appId: "1:135484060912:web:ce14467b4a21dda8dcfe35",
  measurementId: "G-VCFWF3027T",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);

export { 
  db, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
};
