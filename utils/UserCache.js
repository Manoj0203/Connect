import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';

const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getUserData = async (uid) => {
    try {
        const cacheKey = `user_cache_${uid}`;
        const cachedDataStr = await AsyncStorage.getItem(cacheKey);
        
        if (cachedDataStr) {
            const cachedData = JSON.parse(cachedDataStr);
            const now = Date.now();
            
            // Check if cache is still valid
            if (now - cachedData.timestamp < CACHE_EXPIRATION_MS) {
                return cachedData.data;
            }
        }
        
        // Cache expired or missing, fetch from Firebase
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Save to cache with timestamp
            await AsyncStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: userData
            }));
            
            return userData;
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

export const clearUserCache = async (uid) => {
    try {
        await AsyncStorage.removeItem(`user_cache_${uid}`);
    } catch (error) {
        console.error("Error clearing user cache:", error);
    }
};
