import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';

//Screens
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/signupstack/SignupScreen';
import TabManagement from './screens/TabManagement';
import SettingUp from './screens/signupstack/SettingUp';
import SettingsScreen from './screens/SettingsScreen';
import SecurityInfoScreen from './screens/SecurityInfoScreen';
import AuthScreen from './screens/AuthScreen';
import TwoFactScreen from './screens/TwoFactScreen';
import EditScreen from './screens/EditScreen';
import OtherProfile from './screens/OtherProfile';
import SetupAuth from './screens/SetupAuth';
import PrivacyScreen from './screens/PrivacyScreen';
import HelpScreen from './screens/HelpScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import CreatePost from './screens/CreatePost';
import CreateRoomScreen from './screens/CreateRoomScreen';
import RoomDetailScreen from './screens/RoomDetailScreen';
import RoomAboutScreen from './screens/RoomAboutScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import FriendsListScreen from './screens/FriendsListScreen';

import { PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  async function requestNotificationPermission() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 23) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        console.log(granted);
      }
    } else {
      await messaging().requestPermission();
    }
  }

  const getToken = async () => {
    const token = await messaging().getToken();
    console.log('Token ', token);
  };

  useEffect(() => {
    requestNotificationPermission();
    getToken();
  });

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Tabs" component={TabManagement} />
          <Stack.Screen name="SettingUp" component={SettingUp} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Securityinfo" component={SecurityInfoScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="TwoFact" component={TwoFactScreen} />
          <Stack.Screen name="Edit" component={EditScreen} />
          <Stack.Screen name="OtherProfile" component={OtherProfile} />
          <Stack.Screen name="SetupAuth" component={SetupAuth} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
          <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
          <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
          <Stack.Screen name="RoomAbout" component={RoomAboutScreen} />
          <Stack.Screen name="CreatePost" component={CreatePost} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="FriendsList" component={FriendsListScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
