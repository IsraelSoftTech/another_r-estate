import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDS_8mdUqAL4tPN_WvMAo2Tmm1iQwfEC78",
  authDomain: "register-d6145.firebaseapp.com",
  databaseURL: "https://register-d6145-default-rtdb.firebaseio.com",
  projectId: "register-d6145",
  storageBucket: "register-d6145.appspot.com",
  messagingSenderId: "984407699595",
  appId: "1:984407699595:web:1219a9e6312517b254e48e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Ensure we have a Firebase Auth user (anonymous) for security rules that require request.auth
onAuthStateChanged(auth, (user) => {
	if (!user) {
		signInAnonymously(auth).catch(() => {});
	}
});

export const ensureAuthUser = () => new Promise((resolve) => {
	if (auth.currentUser) return resolve(auth.currentUser);
	const unsubscribe = onAuthStateChanged(auth, (user) => {
		if (user) {
			unsubscribe();
			resolve(user);
		}
	});
	// Kick off anon sign-in if needed
	signInAnonymously(auth).catch(() => {});
});

export default app; 