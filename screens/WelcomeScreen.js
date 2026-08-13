import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import auth from '../services/firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';

export default function WelcomeScreen (){
	const { Colour, isDark, TEXT } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onAuthStateChanged(auth, (user) =>
      {
        if(user)
        {
          console.log(user.email)
          navigation.replace("Tabs")
        }
        else
        {
          navigation.replace('Login')
        }
      })
    }, 750);
    return () => clearTimeout(timer);
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