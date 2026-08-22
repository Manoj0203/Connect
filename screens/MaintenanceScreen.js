import { StyleSheet, Text, View, StatusBar, BackHandler } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/Theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MaintenanceScreen({ route }) {
    const { Colour, isDark } = useTheme();
    const message = route.params?.message || "We're currently performing some server upgrades. We'll be back shortly!";
    
    // Prevent back button on Android
    useEffect(() => {
        const onBackPress = () => true;
        BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colour.bg?.backgroundColor || (isDark ? '#121214' : '#F7F7FA'),
            padding: 30,
        },
        iconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: isDark ? '#1C1C1F' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: isDark ? '#2E2E33' : '#E7E7ED',
            shadowColor: isDark ? '#06ec06' : '#00B341',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
        },
        title: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 28,
            color: isDark ? '#F4F4F6' : '#17171B',
            marginBottom: 16,
            textAlign: 'center',
        },
        subtitle: {
            fontFamily: 'Anaheim-Regular',
            fontSize: 16,
            color: isDark ? '#9A9AA5' : '#75758A',
            textAlign: 'center',
            lineHeight: 24,
        }
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="cog-refresh-outline" size={48} color={isDark ? '#06ec06' : '#00B341'} />
            </View>

            <Text style={styles.title}>We'll be right back!</Text>
            <Text style={styles.subtitle}>{message}</Text>
        </SafeAreaView>
    )
}
