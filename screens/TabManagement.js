import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { useEffect } from "react";
import { Platform, } from "react-native";

//Screens
import HomeScreen from "./HomeScreen";
import ProfileScreen from './ProfileScreen';
import CreatePost from './CreatePost'
import SearchScreen from './SearchScreen'

//Icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import { useTheme } from "../utils/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function TabManagement() {
    const { isDark, } = useTheme();

    useEffect(() => {
        const navBarColor = isDark ? '#252525' : '#ffffff';
        const lightIcons = !isDark;

        try {
            if (Platform.OS === 'android') {
                changeNavigationBarColor(navBarColor, lightIcons, false);
            }
        } catch (e) {
            console.log('Error setting navigation bar color:', e);
        }

    }, [isDark]);

    const bgcolor = isDark ? "#252525" : "#fff";
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgcolor }}>
            <Tab.Navigator initialRouteName="Home" screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === "Home") {
                        iconName = 'home'
                        return <FontAwesome name={iconName} size={30} color={color} />
                    }
                    else if (route.name === 'search') {
                        iconName = "search";
                        return <FontAwesome name={iconName} size={27} color={color} />
                    }
                    else if (route.name === "CreatePost") {
                        iconName = 'squared-plus';
                        return <Entypo name={iconName} size={30} color={color} />
                    }
                    else if (route.name === 'Profile') {
                        iconName = "user";
                        return <FontAwesome name={iconName} size={30} color={color} />
                    }
                },
                tabBarActiveTintColor: isDark ? "#06ec06ff" : '#00d100ff',
                tabBarInactiveTintColor: '#7e7e7eff',
                tabBarShowLabel: false,
                tabBarStyle: { height: '6%', backgroundColor: bgcolor, alignItems:'center', alignSelf:'center', justifyContent:'center' }
            })}>
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="search" component={SearchScreen} />
                <Tab.Screen name="CreatePost" component={CreatePost} />
                <Tab.Screen name="Profile" component={ProfileScreen} />

            </Tab.Navigator>
        </SafeAreaView>
    );
}