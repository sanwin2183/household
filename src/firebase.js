// ============================================================
// Firebase configuration for Household Personal Ledger
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdPBUzXJB53cfjRY_rr3WTqVp6IV7_ReM",
  authDomain: "household-4e529.firebaseapp.com",
  projectId: "household-4e529",
  storageBucket: "household-4e529.firebasestorage.app",
  messagingSenderId: "750460558166",
  appId: "1:750460558166:web:002e001c960e8e2bdf14f7",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
