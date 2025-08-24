import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import fs from 'fs';

dotenv.config({ path: '.env.test' });

const isTestMode = process.env.NODE_ENV === 'test';
const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function ensureEmulatorsRunning() {
  try {
    const res = await fetch('http://localhost:8080');
    if (res.ok) return;
  } catch (e) {
    void e;
  }
  try {
    execSync(
      'npx firebase emulators:start --only auth,firestore,storage --detach',
      {
        stdio: 'ignore',
        timeout: 60000,
      }
    );
  } catch (e) {
    void e;
  }
}

async function waitFor(url, attempts = 30, delayMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      void e;
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

async function setupFirebaseRules() {
  if (!useEmulator) return;
  const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;
  fs.writeFileSync('.firestore.rules.test', rules);
  try {
    execSync(
      'npx firebase deploy --only firestore:rules --project plan-e7bc6',
      {
        stdio: 'ignore',
        timeout: 30000,
      }
    );
  } catch (e) {
    void e;
  }
  if (fs.existsSync('.firestore.rules.test'))
    fs.unlinkSync('.firestore.rules.test');
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  if (useEmulator && isTestMode) {
    await ensureEmulatorsRunning();
    await Promise.all([
      waitFor('http://localhost:8080'),
      waitFor('http://localhost:9099'),
    ]);
    try {
      connectAuthEmulator(
        auth,
        process.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099'
      );
    } catch (e) {
      void e;
    }
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (e) {
      void e;
    }
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (e) {
      void e;
    }
  }

  await setupFirebaseRules();
}

// Run only when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => {
    console.error('Test environment setup failed:', e);
    process.exit(1);
  });
}
