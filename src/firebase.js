import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your app's Firebase project configuration
// You can find these in your Firebase Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyAxIUzcALvEgUjScT8adrLNsS7wutZCjLw",
    authDomain: "ai-hive-app.firebaseapp.com",
    projectId: "ai-hive-app",
    storageBucket: "ai-hive-app.firebasestorage.app",
    messagingSenderId: "909752915546",
    appId: "1:909752915546:web:13cf28161ed91d124baa63",
    measurementId: "G-55T1TWQ74R"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);

// Initialize Cloud Firestore and get a reference to the service
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Forces HTTP instead of gRPC stream if network is unstable/restricted
});

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
