import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, getIdToken } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getInstallations, getToken } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-installations.js";

// Initialize firebaseConfig as undefined
let firebaseConfig;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    firebaseConfig = event.data.firebaseConfig;
    console.log('Received Firebase config via postMessage:', firebaseConfig);
  }
});

self.addEventListener("fetch", (event) => {
  const { origin } = new URL(event.request.url);
  if (origin !== self.location.origin) return;
  event.respondWith(fetchWithFirebaseHeaders(event.request));
});

async function fetchWithFirebaseHeaders(request) {
  if (!firebaseConfig) {
    console.error("Firebase config not set. Cannot fetch with Firebase headers.");
    return fetch(request);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const installations = getInstallations(app);
  const headers = new Headers(request.headers);

  const [authIdToken, installationToken] = await Promise.all([
    getAuthIdToken(auth),
    getToken(installations),
  ]);

  headers.append("Firebase-Instance-ID-Token", installationToken);
  if (authIdToken) headers.append("Authorization", `Bearer ${authIdToken}`);

  const newRequest = new Request(request, { headers });
  return await fetch(newRequest);
}

async function getAuthIdToken(auth) {
  await auth.authStateReady();
  if (!auth.currentUser) return;
  return await getIdToken(auth.currentUser);
}

