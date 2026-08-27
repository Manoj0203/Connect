import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../utils/Card';
import auth from '../services/firebaseAuth';

export default function PostDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { isDark, TEXT } = useTheme();
    const user = auth.currentUser;
    
    const { post } = route.params || {};

    const bg = isDark ? '#121214' : '#F7F7FA';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={fontcolor} />
                </TouchableOpacity>
                <Text style={[TEXT.heading, { fontSize: 20, marginLeft: 0 }]}>Post</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}>
                {post ? (
                    <Card item={post} curruser={user?.uid} />
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 50, color: fontcolor }}>Post not found.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
});
