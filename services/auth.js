// src/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "ID_PENGIRIM",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// === LOGIN ===
export async function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// === LOGOUT ===
export async function logoutAdmin() {
  return signOut(auth);
}

// === CEK USER ===
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// === CONTOH AMBIL DATA FIRESTORE (readonly) ===
export async function getDataKamar() {
  const snap = await getDocs(collection(db, "kamar"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
