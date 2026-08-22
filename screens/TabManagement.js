import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import React, { useEffect, useRef } from "react";
import { Platform, View, TouchableOpacity, StyleSheet, Animated } from "react-native";

//Screens
import HomeScreen from "./HomeScreen";
import ProfileScreen from './ProfileScreen';
import SearchScreen from './SearchScreen';
import RoomsScreen from './RoomsScreen';

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
    Rooms: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
};

function AnimatedAddButton({ activeRouteName, navigation, styles }) {
    const showAdd = activeRouteName === 'Home' || activeRouteName === 'Rooms';
    const anim = useRef(new Animated.Value(showAdd ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: showAdd ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [showAdd]);

    const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 54]
    });

    const scale = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 1]
    });

    const opacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    });

    return (
        <Animated.View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ transform: [{ scale }], opacity, position: 'absolute' }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.createTab}
                    onPress={() => {
                        if (activeRouteName === 'Home') navigation.navigate('CreatePost');
                        if (activeRouteName === 'Rooms') navigation.navigate('CreateRoom');
                    }}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

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
            borderRadius: 15,
            borderWidth: 1,
            borderColor: Colour.border,
            paddingVertical: SPACING.sm,
            ...Colour.shadow,
        },
        tab: {
            width: 48,
            height: 48,
            borderRadius: 15,
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
                    const activeRouteName = state.routes[state.index].name;

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

                    const icon = ICONS[route.name];
                    const tabElement = (
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

                    // Inject the Add button after index 1 (Search tab)
                    if (index === 1) {
                        return (
                            <React.Fragment key={route.key + "_frag"}>
                                {tabElement}
                                <AnimatedAddButton activeRouteName={activeRouteName} navigation={navigation} styles={styles} />
                            </React.Fragment>
                        );
                    }

                    return tabElement;
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
            <Tab.Screen name="Rooms" component={RoomsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}