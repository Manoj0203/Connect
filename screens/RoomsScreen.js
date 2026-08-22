import { StyleSheet, Platform, Text, TouchableOpacity, View, FlatList, RefreshControl, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../services/firebaseAuth';
import auth from '../services/firebaseAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ActivityIndicator, Searchbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoomsScreen() {
    const navigation = useNavigation();
    const curruser = auth.currentUser;
    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();
    const isFocused = useIsFocused();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!curruser) return;
        if (isFocused) {
            loadRooms();
        }
    }, [isFocused]);

    const loadRooms = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            // Check cache first if not refreshing
            if (!isRefresh) {
                const cached = await AsyncStorage.getItem(`cached_rooms_${curruser.uid}`);
                if (cached) {
                    setRooms(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const q = query(collection(db, 'rooms'), where('members', 'array-contains', curruser.uid));
            const snapshot = await getDocs(q);
            const loadedRooms = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Sort rooms by last message time descending
            loadedRooms.sort((a, b) => {
                const getTime = (t) => t ? (t.seconds ? t.seconds * 1000 : t) : 0;
                const timeA = getTime(a.lastMessageTime || a.createdAt);
                const timeB = getTime(b.lastMessageTime || b.createdAt);
                return timeB - timeA;
            });

            setRooms(loadedRooms);
            await AsyncStorage.setItem(`cached_rooms_${curruser.uid}`, JSON.stringify(loadedRooms));
        } catch (error) {
            console.log('Error loading rooms:', error);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadRooms(true);
            return;
        }
        setLoading(true);
        try {
            const q = collection(db, 'rooms');
            const snapshot = await getDocs(q);
            const allRooms = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            const filtered = allRooms.filter(r => r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
            setRooms(filtered);
        } catch (error) {
            console.log('Error searching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

                const stringToColor = (string, bright = false) => {
        const PREDEFINED_COLORS = [
            '#00796B', // Dark Teal
            '#0288D1', // Dark Light Blue
            '#1976D2', // Dark Blue
            '#303F9F', // Dark Indigo
            '#512DA8', // Dark Deep Purple
            '#7B1FA2', // Dark Purple
            '#F57C00', // Dark Orange
            '#E64A19', // Dark Deep Orange
            '#5D4037', // Dark Brown
            '#455A64', // Dark Blue Grey
        ];
        const BRIGHT_COLORS = [
            '#26A69A', // Bright Teal
            '#29B6F6', // Bright Light Blue
            '#42A5F5', // Bright Blue
            '#5C6BC0', // Bright Indigo
            '#7E57C2', // Bright Deep Purple
            '#AB47BC', // Bright Purple
            '#FFA726', // Bright Orange
            '#FF7043', // Bright Deep Orange
            '#8D6E63', // Bright Brown
            '#78909C', // Bright Blue Grey
        ];
        const targetColors = bright ? BRIGHT_COLORS : PREDEFINED_COLORS;
        if (!string) return targetColors[0];
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % targetColors.length;
        return targetColors[index];
    };

    const renderRoom = ({ item }) => {
        const isMember = item.members && item.members.includes(curruser.uid);
        return (
            <TouchableOpacity
                style={[styles.roomCard, { backgroundColor: Colour.card.backgroundColor, borderColor: Colour.border }]}
                onPress={() => {
                    if (isMember) {
                        navigation.navigate('RoomDetail', { room: item });
                    } else {
                        // If not a member, prompt to join (e.g. via modal or alert)
                        // For simplicity, we can navigate to RoomDetail which will ask for password if not member
                        // Wait, it's better to navigate to RoomDetail with a param to show Join modal
                        navigation.navigate('RoomDetail', { room: item });
                    }
                }}
            >
                <View style={[styles.groupPic, { backgroundColor: stringToColor(item.id) }]}>
                    {item.groupPic ? (
                        <Image source={{ uri: item.groupPic }} style={{ width: 44, height: 44, borderRadius: 10 }} />
                    ) : (
                        <Ionicons name="chatbubbles" size={21} color={'#fff'} />
                    )}
                </View>
                <View style={styles.roomInfo}>
                    <Text style={[TEXT.usernametxt, { color: Colour.textPrimary, marginLeft: 0 }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary }]} numberOfLines={1}>
                        {item.lastMessageContent 
                            ? `${item.lastMessageUsername}: ${item.lastMessageContent}`
                            : `${item.members ? item.members.length : 0} members`}
                    </Text>
                </View>
                {item.unreadBy && item.unreadBy.includes(curruser.uid) && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stringToColor(item.id, true), marginLeft: 10 }} />
                )}
                {!isMember && (
                    <Ionicons name="lock-closed" size={20} color={Colour.textSecondary} style={{ marginLeft: 10 }} />
                )}
            </TouchableOpacity>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colour.bg.backgroundColor,
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 0,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colour.card.backgroundColor,
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
            paddingHorizontal: SPACING.md,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: Colour.border,
            height: 48,
        },
        searchInput: {
            flex: 1,
            marginLeft: SPACING.sm,
            color: Colour.textPrimary,
            fontFamily: 'Anaheim-SemiBold',
        },
        list: {
            paddingHorizontal: 15,
            paddingBottom: 100, // For bottom tab
        },
        roomCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            marginBottom: SPACING.md,
        },
        groupPic: {
            width: 44,
            height: 44,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md,
        },
        roomInfo: {
            flex: 1,
        },
        fab: {
            position: 'absolute',
            bottom: 100,
            right: SPACING.lg,
            backgroundColor: Colour.accent,
            width: 56,
            height: 56,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
            shadowColor: Colour.accent,
            shadowOpacity: 0.3,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
        }
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={[TEXT.heading, { color: Colour.textPrimary }]}>Rooms</Text>
            </View>

            <Searchbar placeholder='Search Rooms...'
                placeholderTextColor={isDark ? '#b5b5b5dc' : '#7e7e7eff'}
                onChangeText={(query) => {
                    setSearchQuery(query);
                    if (query.trim() === '') {
                        loadRooms(true);
                    }
                }}
                onSubmitEditing={handleSearch}
                onClearIconPress={() => { setSearchQuery(''); loadRooms(true); }}
                value={searchQuery}
                inputStyle={{ marginTop: -8, fontFamily: 'Anaheim-SemiBold', color: Colour.textPrimary }}
                style={{ backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4', marginHorizontal: 10, marginTop: 10, height: 40, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#555e56' : '#E7E7ED', marginBottom: 10 }} />


            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={Colour.accent} size="large" />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={item => item.id}
                    renderItem={renderRoom}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadRooms(true)} tintColor={Colour.accent} />
                    }
                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={[TEXT.emptyTextContainer, { marginTop: '80%' }]}>No Rooms Found</Text>
                        </View>
                    )}
                />
            )}

        </SafeAreaView>
    );
}




