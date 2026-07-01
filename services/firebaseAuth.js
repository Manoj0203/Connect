// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth  } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// ... (Firebase configuration object) ...

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AKnQM",
  authDomain: "cm",
  projectId: "6",
  storageBucket: "cp",
  messagingSenderId: "24",
  appId: "1:21"
};

let auth;
let app;
if(getApps().length == 0)
{
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    })    
}
else
{
    auth = getAuth();
}

// Correctly exports the initialized Auth object for direct use in components:
export default auth; 
export const db = getFirestore(app)
export const storage = getStorage(app);
