import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  runTransaction
} from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9cPaFdxvENw1tR05buuKUCezkyEE_wcg",
  authDomain: "agdm-unicorn-challenge.firebaseapp.com",
  projectId: "agdm-unicorn-challenge",
  storageBucket: "agdm-unicorn-challenge.firebasestorage.app",
  messagingSenderId: "556773660144",
  appId: "1:556773660144:web:727576f2058447fc727935",
  measurementId: "G-GW10GSR099"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  runTransaction
};