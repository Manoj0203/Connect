import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { useEffect } from "react";
import { Platform, View, TouchableOpacity, StyleSheet } from "react-native";

//Screens
import HomeScreen from "./HomeScreen";
import ProfileScreen from './ProfileScreen';
import CreatePost from './CreatePost';
import SearchScreen from './SearchScreen';

//Icons — Ionicons only, matching HomeScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from "../utils/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

// Filled icon on focus, outline when idle — mirrors the heart-outline
// treatment already used in HomeScreen's header button.
const ICONS = {
    Home: { active: 'home', inactive: 'home-outline' },
    search: { active: 'search', inactive: 'search-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
};

function CustomTabBar({ state, navigation }) {
    const { Colour, SPACING, RADIUS } = useTheme();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        wrapper: {
            position: 'absolute',
            left: SPACING.lg,
            right: SPACING.lg,
            bottom: insets.bottom + SPACING.sm,
        },
        bar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: Colour.card.backgroundColor,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: Colour.border,
            paddingVertical: SPACING.sm,
            ...Colour.shadow,
        },
        tab: {
            width: 48,
            height: 48,
            borderRadius: RADIUS.pill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tabActive: {
            backgroundColor: Colour.accentSoft,
        },
        createTab: {
            width: 54,
            height: 54,
            borderRadius: RADIUS.pill,
            backgroundColor: Colour.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -18,
            shadowColor: Colour.accent,
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
        },
    });

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Create gets its own elevated treatment, not a regular tab slot.
                    if (route.name === 'CreatePost') {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.85}
                                style={styles.createTab}
                            >
                                <Ionicons name="add" size={28} color="#fff" />
                            </TouchableOpacity>
                        );
                    }

                    const icon = ICONS[route.name];
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.7}
                            style={[styles.tab, isFocused && styles.tabActive]}
                        >
                            <Ionicons
                                name={isFocused ? icon.active : icon.inactive}
                                size={22}
                                color={isFocused ? Colour.accent : Colour.textSecondary}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function TabManagement() {
    const { isDark } = useTheme();

    useEffect(() => {
        const navBarColor = isDark ? '#121214' : '#ffffff';
        const lightIcons = !isDark;

        try {
            if (Platform.OS === 'android') {
                changeNavigationBarColor(navBarColor, lightIcons, false);
            }
        } catch (e) {
            console.log('Error setting navigation bar color:', e);
        }
    }, [isDark]);

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="search" component={SearchScreen} />
            <Tab.Screen name="CreatePost" component={CreatePost} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}