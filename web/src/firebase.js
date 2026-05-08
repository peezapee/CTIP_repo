import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJ6iYOUpq61otrR7QaZbER9Z6JfSgQ2kI",
  authDomain: "digital-park-guide.firebaseapp.com",
  projectId: "digital-park-guide",
  storageBucket: "digital-park-guide.firebasestorage.app",
  messagingSenderId: "551133300896",
  appId: "1:551133300896:web:aac0d646b0b450bfd6e1c5",
  measurementId: "G-PTZQ8Z1Y4S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);