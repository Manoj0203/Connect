import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//Screens
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/signupstack/SignupScreen';
import TabManagement from './screens/TabManagement';
import SettingUp from './screens/signupstack/SettingUp'
import SettingsScreen from './screens/SettingsScreen'
import SecurityInfoScreen from './screens/SecurityInfoScreen';
import AuthScreen from './screens/AuthScreen';
import TwoFactScreen from './screens/TwoFactScreen';
import EditScreen from './screens/EditScreen';
import OtherProfile from './screens/OtherProfile';

import { PaperProvider } from 'react-native-paper';

const Stack = createNativeStackNavigator();

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{headerShown:false}}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Tabs" component={TabManagement} />
          <Stack.Screen name="SettingUp" component={SettingUp} />        
          <Stack.Screen name='Settings' component={SettingsScreen} />
          <Stack.Screen name='Securityinfo' component={SecurityInfoScreen} />
          <Stack.Screen name='Auth' component={AuthScreen} />
          <Stack.Screen name='TwoFact' component={TwoFactScreen} />
          <Stack.Screen name='Edit' component={EditScreen} />
          <Stack.Screen name='OtherProfile' component={OtherProfile} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}