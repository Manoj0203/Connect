import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import auth, { db } from '../services/firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen (){
	const { Colour, isDark, TEXT } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;

    const performChecks = async () => {
      // 1. Check Maintenance (with 3-second timeout)
      try {
        // Use production Vercel URL
        const BACKEND_URL = 'https://connect-backend-hazel.vercel.app/';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${BACKEND_URL}status`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await res.json();
        
        if (data.maintenance && isMounted) {
          navigation.replace('Maintenance', { message: data.message });
          return; // Stop further checks
        }
      } catch (err) {
        console.log("Maintenance check failed, proceeding normally", err.message);
      }

      // 2. Delay for visual splash (ensure minimum 750ms total time)
      await new Promise(resolve => setTimeout(resolve, 750));
      if (!isMounted) return;

      // 3. Check Auth Status
      onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        
        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().twoFactorEnabled === true && docSnap.data().authMethod === 'pin') {
                const verified = await AsyncStorage.getItem(`2fa_verified_${user.uid}`);
                if (verified !== 'true') {
                    navigation.replace("SetupAuth", {
                        mode: "verify",
                        action: "disable",
                        onSuccess: async () => {
                            await AsyncStorage.setItem(`2fa_verified_${user.uid}`, 'true');
                            navigation.replace('Tabs');
                        },
                        onFail: () => {}
                    });
                    return;
                }
            }
          } catch (e) {
            console.log(e);
          }
          navigation.replace("Tabs");
        } else {
          navigation.replace('Login');
        }
      });
    };

    performChecks();

    return () => {
      isMounted = false;
    };
  }, []);

  const styles = StyleSheet.create({
      container:
      {
          flex:1,
          justifyContent:'center',
          alignItems:'center',
          backgroundColor: Colour.bg
      }
  })

  return (
    <SafeAreaView style={[Colour.bg, {alignItems:'center', justifyContent:'center'}]}>
      <StatusBar barStyle={'dark-content'} />
      <Text style={TEXT.heading}>Welcome</Text>
      <Text style={TEXT.moto}>Connect with lovable one!!</Text>
    </SafeAreaView>
  )
}