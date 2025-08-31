import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCy2Zz38osDFonOeu2hxloorv21SXsNj9A",
  authDomain: "supplier-f562f.firebaseapp.com",
  projectId: "supplier-f562f",
  storageBucket: "supplier-f562f.firebasestorage.app",
  messagingSenderId: "71068966399",
  appId: "1:71068966399:web:0b83b8caf89a771fb09bca",
  measurementId: "G-ZC1T6MEP63"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;