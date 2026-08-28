import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import auth, { db } from '../services/firebaseAuth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, deleteDoc, writeBatch, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { clearUserCache } from '../utils/UserCache';

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const curruser = auth.currentUser;
    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();

    const [loading, setLoading] = useState(true);
    const [roomInvites, setRoomInvites] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);

    const [showAllRooms, setShowAllRooms] = useState(false);
    const [showAllFriends, setShowAllFriends] = useState(false);

    useEffect(() => {
        if (!curruser) return;
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 1. Fetch Room Invites
            const roomsRef = collection(db, 'rooms');
            const roomsQuery = query(roomsRef, where('invited', 'array-contains', curruser.uid));
            const roomsSnap = await getDocs(roomsQuery);
            const roomsData = roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomInvites(roomsData);

            // 2. Fetch Friend Requests
            const requestsRef = collection(db, 'users', curruser.uid, 'Connect_RequestsRecieved');
            const reqsSnap = await getDocs(requestsRef);
            const reqsData = reqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFriendRequests(reqsData);
            
        } catch (error) {
            console.log('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptFriend = async (request) => {
        try {
            const batch = writeBatch(db);
            const fromUid = request.from;

            // Add to each other's friends array
            batch.update(doc(db, 'users', curruser.uid), {
                friendslist: arrayUnion(fromUid),
                friends: increment(1)
            });
            batch.update(doc(db, 'users', fromUid), {
                friendslist: arrayUnion(curruser.uid),
                friends: increment(1)
            });

            // Delete the request from sender to receiver
            batch.delete(doc(db, 'users', curruser.uid, 'Connect_RequestsRecieved', fromUid));
            batch.delete(doc(db, 'users', fromUid, 'Connect_RequestsSent', curruser.uid));

            // Decrement requests count on the sender
            batch.update(doc(db, 'users', fromUid), {
                requests: increment(-1)
            });

            // Check if there is a reciprocal request (current user sent to sender previously)
            const reciprocalReqRef = doc(db, 'users', fromUid, 'Connect_RequestsRecieved', curruser.uid);
            const reciprocalReqSnap = await getDoc(reciprocalReqRef);
            
            if (reciprocalReqSnap.exists()) {
                batch.delete(reciprocalReqRef);
                batch.delete(doc(db, 'users', curruser.uid, 'Connect_RequestsSent', fromUid));
                batch.update(doc(db, 'users', curruser.uid), {
                    requests: increment(-1)
                });
            }

            await batch.commit();
            await clearUserCache(curruser.uid);
            await clearUserCache(fromUid);

            // Remove from local state
            setFriendRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (error) {
            console.log('Error accepting friend:', error);
        }
    };

    const handleRejectFriend = async (request) => {
        try {
            const batch = writeBatch(db);
            const fromUid = request.from;

            batch.delete(doc(db, 'users', curruser.uid, 'Connect_RequestsRecieved', fromUid));
            batch.delete(doc(db, 'users', fromUid, 'Connect_RequestsSent', curruser.uid));

            batch.update(doc(db, 'users', fromUid), {
                requests: increment(-1)
            });

            await batch.commit();
            await clearUserCache(fromUid);
            setFriendRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (error) {
            console.log('Error rejecting friend:', error);
        }
    };

    const handleRejectRoom = async (roomObj) => {
        try {
            await updateDoc(doc(db, 'rooms', roomObj.id), {
                invited: arrayRemove(curruser.uid)
            });
            setRoomInvites(prev => prev.filter(r => r.id !== roomObj.id));
        } catch(error) {
            console.log('Error rejecting room:', error);
        }
    };

                const stringToColor = (string) => {
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
        if (!string) return PREDEFINED_COLORS[0];
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % PREDEFINED_COLORS.length;
        return PREDEFINED_COLORS[index];
    };

    const renderRoomInvite = (room) => {
        const mCount = room.members ? room.members.length : 0;
        return (
            <TouchableOpacity 
                key={room.id}
                style={styles.notificationCard}
                onPress={() => navigation.navigate('RoomDetail', { room })}
            >
                <View style={[styles.avatar, { backgroundColor: stringToColor(room.id) }]}>
                    {room.groupPic ? (
                        <Image source={{ uri: room.groupPic }} style={styles.avatarImg} />
                    ) : (
                        <Ionicons name="chatbubbles" size={20} color={'#fff'} />
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>Room Invite: {room.name}</Text>
                    <Text style={styles.subtitle}>{mCount} members</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colour.accent + '20' }]} onPress={() => navigation.navigate('RoomDetail', { room })}>
                        <Ionicons name="checkmark" size={18} color={Colour.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FF2F3220' }]} onPress={() => handleRejectRoom(room)}>
                        <Ionicons name="close" size={18} color="#FF2F32" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFriendRequest = (req) => {
        return (
            <View key={req.id} style={styles.notificationCard}>
                <View style={[styles.avatar, { backgroundColor: Colour.border }]}>
                    {req.fromprofile ? (
                        <Image source={{ uri: req.fromprofile }} style={styles.avatarImg} />
                    ) : (
                        <Ionicons name="person" size={20} color={Colour.textSecondary} />
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{req.fromname}</Text>
                    <Text style={styles.subtitle}>@{req.fromusername || req.from}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colour.accent + '20' }]} onPress={() => handleAcceptFriend(req)}>
                        <Ionicons name="checkmark" size={18} color={Colour.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FF2F3220' }]} onPress={() => handleRejectFriend(req)}>
                        <Ionicons name="close" size={18} color="#FF2F32" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colour.bg.backgroundColor,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
        },
        backBtn: {
            marginRight: 15,
        },
        section: {
            marginTop: 10,
            marginBottom: 20,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 10,
        },
        sectionTitle: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 18,
            color: Colour.textPrimary,
        },
        showAllBtn: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 14,
            color: Colour.accent,
        },
        notificationCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colour.card.backgroundColor,
            padding: 15,
            marginHorizontal: 20,
            marginBottom: 10,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: Colour.border,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            overflow: 'hidden',
        },
        avatarImg: {
            width: '100%',
            height: '100%',
        },
        info: {
            flex: 1,
        },
        title: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
            color: Colour.textPrimary,
            marginBottom: 2,
        },
        subtitle: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 13,
            color: Colour.textSecondary,
        },
        actionPill: {
            backgroundColor: isDark ? '#2E2E33' : '#E7E7ED',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginLeft: 10,
        },
        actionText: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 13,
            color: Colour.textPrimary,
        },
        iconBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 4,
        },
        emptyText: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 14,
            color: Colour.textSecondary,
            textAlign: 'center',
            marginTop: 10,
        }
    });

    const displayedRooms = showAllRooms ? roomInvites : roomInvites.slice(0, 3);
    const displayedFriends = showAllFriends ? friendRequests : friendRequests.slice(0, 3);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colour.textPrimary} />
                </TouchableOpacity>
                <Text style={[TEXT.heading, { color: Colour.textPrimary, flex: 1 }]}>Notifications</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colour.accent} />
                </View>
            ) : roomInvites.length === 0 && friendRequests.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}>
                    <Ionicons name="notifications-off-outline" size={60} color={isDark ? '#4a4a52' : '#c7c7d1'} />
                    <Text style={{ marginTop: 15, fontFamily: 'Anaheim-SemiBold', fontSize: 16, color: isDark ? '#9A9AA5' : '#75758A' }}>
                        No new notifications
                    </Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    {/* ROOM INVITES SECTION */}
                    {roomInvites.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Room Invites</Text>
                                {roomInvites.length > 3 && (
                                    <TouchableOpacity onPress={() => setShowAllRooms(!showAllRooms)}>
                                        <Text style={styles.showAllBtn}>{showAllRooms ? 'Show Less' : 'Show All'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {displayedRooms.map(room => renderRoomInvite(room))}
                        </View>
                    )}

                    {/* FRIEND REQUESTS SECTION */}
                    {friendRequests.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Friend Requests</Text>
                                {friendRequests.length > 3 && (
                                    <TouchableOpacity onPress={() => setShowAllFriends(!showAllFriends)}>
                                        <Text style={styles.showAllBtn}>{showAllFriends ? 'Show Less' : 'Show All'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {displayedFriends.map(req => renderFriendRequest(req))}
                        </View>
                    )}

                </ScrollView>
            )}
        </SafeAreaView>
    );
}
