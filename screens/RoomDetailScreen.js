import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl, TextInput, Alert, KeyboardAvoidingView, Platform, Image, Keyboard } from 'react-native';
import AlertModal from '../utils/AlertModal';
import React, { useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import { getUserData } from '../utils/UserCache';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth, { db } from '../services/firebaseAuth';
import { collection, query, where, getDocs, orderBy, onSnapshot, addDoc, doc, getDoc, deleteDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import Card from '../utils/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoomDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { room } = route.params;
    const curruser = auth.currentUser;
    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();
    const insets = useSafeAreaInsets();

    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', singleButton: true, onConfirm: null, btnText: 'Okay' });
    const showAlert = (title, message, buttons) => {
        if (buttons && buttons.length > 1) {
            const confirmBtn = buttons.find(b => b.text !== 'Cancel' && b.style !== 'cancel') || buttons[1];
            setAlertConfig({ visible: true, title, message, singleButton: false, onConfirm: confirmBtn.onPress, btnText: confirmBtn.text || 'Okay' });
        } else {
            setAlertConfig({ visible: true, title, message, singleButton: true, onConfirm: null, btnText: 'Okay' });
        }
    };
    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const [isMember, setIsMember] = useState(room.members && room.members.includes(curruser.uid));
    const [password, setPassword] = useState('');
    const [joining, setJoining] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(isMember);
    const [refreshing, setRefreshing] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);

    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [longPressedMessage, setLongPressedMessage] = useState(null);
    const [isMessageOptionsVisible, setIsMessageOptionsVisible] = useState(false);
    const [reportedMessageIds, setReportedMessageIds] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

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

    const roomColor = stringToColor(room.id);

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/"; // Env

    const handleSendMessage = async () => {
        if (!messageText.trim() || sending) return;
        setSending(true);
        try {
            if (editingMessage) {
                await updateDoc(doc(db, 'roomPosts', editingMessage.postID), {
                    content: messageText.trim(),
                    isEdited: true
                });
                setEditingMessage(null);
            } else {
                const userData = await getUserData(curruser.uid);
                const newPost = {
                    roomId: room.id,
                    userID: curruser.uid,
                    content: messageText.trim(),
                    time: Date.now(),
                    pic: userData.image || null,
                    username: userData.username,
                    fullName: userData.fullname,
                    verified: userData.isVerified || false,
                    replyToId: replyingTo ? replyingTo.postID : null,
                    replyToUserId: replyingTo ? replyingTo.userId : null,
                    replyToUsername: replyingTo ? replyingTo.username : null,
                    replyToContent: replyingTo ? replyingTo.content : null,
                };
                await addDoc(collection(db, 'roomPosts'), newPost);

                const roomSnap = await getDoc(doc(db, 'rooms', room.id));
                if (roomSnap.exists()) {
                    const roomData = roomSnap.data();
                    const members = roomData.members || [];
                    const unreadBy = members.filter(uid => uid !== curruser.uid);
                    await updateDoc(doc(db, 'rooms', room.id), {
                        lastMessageTime: newPost.time,
                        lastMessageContent: newPost.content,
                        lastMessageUsername: newPost.username,
                        unreadBy: unreadBy
                    });
                }
            }

            setMessageText('');
            setReplyingTo(null);
        } catch (error) {
            console.log('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const canView = isMember || room.visibility === 'public';

    useEffect(() => {
        if (canView) {
            const fetchBlockedUsers = async () => {
                const userData = await getUserData(curruser.uid);
                if (userData) {
                    setBlockedUsers(userData.blockedUsers || []);
                }
            };
            fetchBlockedUsers();
            loadPosts();

            // Clear unread status when opening room
            if (curruser && isMember) {
                updateDoc(doc(db, 'rooms', room.id), {
                    unreadBy: arrayRemove(curruser.uid)
                }).catch(e => console.log('Error clearing unread', e));
            }

            const unsubscribe = subscribeToPosts();
            return () => unsubscribe();
        }
    }, [canView, isMember]);

    const loadPosts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            if (!isRefresh) {
                const cached = await AsyncStorage.getItem(`cached_roomPosts_${room.id}`);
                if (cached) {
                    setPosts(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const q = query(collection(db, 'roomPosts'), where('roomId', '==', room.id), orderBy('time', 'desc'));
            const snapshot = await getDocs(q);
            const loadedPosts = await Promise.all(snapshot.docs.map(async docSnap => {
                const post = docSnap.data();
                // Simple version, assuming user info might be needed
                return { ...post, postID: docSnap.id };
            }));

            setPosts(loadedPosts);
            await AsyncStorage.setItem(`cached_roomPosts_${room.id}`, JSON.stringify(loadedPosts));
        } catch (error) {
            console.log('Error loading room posts:', error);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const subscribeToPosts = () => {
        const q = query(collection(db, 'roomPosts'), where('roomId', '==', room.id), orderBy('time', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const loadedPosts = snapshot.docs.map(docSnap => ({ ...docSnap.data(), postID: docSnap.id }));
            setPosts(loadedPosts);
            AsyncStorage.setItem(`cached_roomPosts_${room.id}`, JSON.stringify(loadedPosts));
        });
    };

    const isInvited = room.invited && room.invited.includes(curruser.uid);

    const handleJoin = async () => {
        Keyboard.dismiss();
        if (room.visibility !== 'public' && !isInvited && !password) {
            setSnackbarMessage("Enter password");
            setSnackbarVisible(true);
            return;
        }
        setJoining(true);
        try {
            if (room.visibility === 'public' || isInvited) {
                // Bypass backend password check for public rooms or invited users
                await updateDoc(doc(db, 'rooms', room.id), {
                    members: arrayUnion(curruser.uid),
                    ...(isInvited && { invited: arrayRemove(curruser.uid) })
                });
                setIsMember(true);
            } else {
                // Call backend for private rooms to check password
                const token = await curruser.getIdToken();
                const response = await fetch(`${BACKEND_URL}joinRoom`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        roomId: room.id,
                        password
                    })
                });

                const result = await response.json();
                if (result.success) {
                    setIsMember(true);
                } else {
                    setSnackbarMessage(result.message || "Incorrect password");
                    setSnackbarVisible(true);
                }
            }
        } catch (error) {
            setSnackbarMessage("Could not join room");
            setSnackbarVisible(true);
        } finally {
            setJoining(false);
        }
    };

    const renderJoinUI = () => (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.joinContainer}>
            <Ionicons name={room.visibility === 'public' ? "globe" : "lock-closed"} size={60} color={Colour.textSecondary} style={{ marginBottom: 20 }} />
            <Text style={[TEXT.heading, { color: Colour.textPrimary, marginBottom: 10 }]}>{room.visibility === 'public' ? "Public Room" : "Private Room"}</Text>
            
            {isInvited ? (
                <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary, marginBottom: 20, textAlign: 'center' }]}>
                    You have been invited to {room.name}!
                </Text>
            ) : (
                <>
                    <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary, marginBottom: 20, textAlign: 'center' }]}>
                        {room.name} requires a password to join.
                    </Text>

                    <View style={styles.inputRow}>
                        <Ionicons name="key" size={20} color={Colour.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Password"
                            placeholderTextColor={Colour.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </>
            )}

            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={joining}>
                {joining ? <ActivityIndicator color="#000" /> : <Text style={styles.joinBtnText}>{isInvited ? "Accept Invite" : "Join Room"}</Text>}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleDeleteMessage = async () => {
        if (!longPressedMessage) return;
        try {
            await deleteDoc(doc(db, 'roomPosts', longPressedMessage.postID));
            setIsMessageOptionsVisible(false);
            setLongPressedMessage(null);
        } catch (error) {
            console.log('Error deleting message:', error);
        }
    };

    const renderMessage = ({ item }) => {
        if (blockedUsers.includes(item.userID)) return null;

        const isMe = item.userID === curruser.uid;

        const roomColor = stringToColor(room.id);
        const bubbleBg = isMe ? roomColor : Colour.card.backgroundColor;
        const textColor = isMe ? '#FFFFFF' : Colour.textPrimary;
        const timeColor = isMe ? 'rgba(255,255,255,0.7)' : Colour.textSecondary;
        const replyLineColor = isMe ? '#FFFFFF' : roomColor;
        const replyBgColor = isMe ? 'rgba(0,0,0,0.2)' : Colour.bg.backgroundColor;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => {
                    setLongPressedMessage(item);
                    setIsMessageOptionsVisible(true);
                }}
                style={{
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    marginVertical: 6,
                    paddingHorizontal: 10,
                }}
            >
                {!isMe && (
                    <View style={{ width: 28, height: 28, borderRadius: 5, marginRight: 8, marginBottom: 4, backgroundColor: Colour.border, overflow: 'hidden' }}>
                        {item.pic ? (
                            <Image source={{ uri: item.pic }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Ionicons name="person" size={16} color="#fff" style={{ alignSelf: 'center', marginTop: 6 }} />
                        )}
                    </View>
                )}

                <View style={{
                    maxWidth: '75%',
                    backgroundColor: bubbleBg,
                    padding: 10,
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: !isMe ? 4 : 16,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: Colour.border,
                }}>
                    {item.replyToId && (
                        <View style={{
                            backgroundColor: replyBgColor,
                            padding: 6,
                            borderRadius: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: replyLineColor,
                            marginBottom: 6,
                        }}>
                            <Text style={{ fontFamily: 'Anaheim-Bold', fontSize: 12, color: replyLineColor }}>
                                {item.replyToUserId === curruser.uid ? 'You' : item.replyToUsername}
                            </Text>
                            <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 12, color: textColor, opacity: 0.8 }} numberOfLines={2}>
                                {item.replyToContent}
                            </Text>
                        </View>
                    )}

                    {!isMe && (
                        <Text style={{ fontFamily: 'Anaheim-Bold', fontSize: 13, color: lightenColor(roomColor, 50), marginBottom: 2 }}>
                            {item.username}
                        </Text>
                    )}

                    <Text style={{
                        fontFamily: 'Anaheim-Regular',
                        fontSize: 15,
                        color: textColor,
                        lineHeight: 20,
                    }}>
                        {item.content}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 }}>
                        {item.isEdited && (
                            <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 10, color: timeColor, marginRight: 4, fontStyle: 'italic' }}>
                                (edited)
                            </Text>
                        )}
                        <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 10, color: timeColor }}>
                            {formatTime(item.time)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <TouchableOpacity
            style={styles.header}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RoomAbout', { room })}
        >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colour.textPrimary} />
            </TouchableOpacity>

            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: stringToColor(room.id), marginRight: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {room.groupPic ?
                    <Image source={{ uri: room.groupPic }} style={{ width: '100%', height: '100%' }} />
                    :
                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                }
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[TEXT.subheading, { color: Colour.textPrimary, marginLeft: 0, marginTop: -5 }]} numberOfLines={1}>{room.name}</Text>
                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 13, color: Colour.textSecondary, marginTop: -8 }}>
                    {room.members ? room.members.length : 0} members
                </Text>
            </View>
        </TouchableOpacity>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colour.bg.backgroundColor,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '5%',
            paddingTop: Platform.OS === 'ios' ? 5 : 12,
            paddingBottom: 8,
            backgroundColor: Colour.bg.backgroundColor,
            borderBottomWidth: 1,
            borderBottomColor: Colour.border,
        },
        backBtn: {
            marginRight: SPACING.md,
        },
        joinContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xl,
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colour.card.backgroundColor,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: Colour.border,
            paddingHorizontal: SPACING.md,
            height: 50,
            width: '100%',
            marginBottom: SPACING.lg,
        },
        textInput: {
            flex: 1,
            color: Colour.textPrimary,
            fontFamily: 'Anaheim-SemiBold',
        },
        joinBtn: {
            backgroundColor: Colour.accent,
            borderRadius: RADIUS.md,
            paddingVertical: 14,
            width: '100%',
            alignItems: 'center',
        },
        joinBtnText: {
            color: '#000',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
        },
        list: {
            paddingBottom: 20,
        },
    });

    if (!canView) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                {renderJoinUI()}
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    onclick={() => setSnackbarVisible(false)}
                    duration={3000}
                    wrapperStyle={{ position: 'absolute' }}
                    style={{ height: 'auto' }}
                    sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}
                >
                    <Text style={{ color: '#fff', fontFamily: 'Anaheim-SemiBold' }}>{snackbarMessage}</Text>
                </Snackbar>
            </SafeAreaView>
        );
    }

    const lightenColor = (hex, amount = 20) => {
        const num = parseInt(hex.replace('#', ''), 16);

        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);

        return `rgb(${r}, ${g}, ${b})`;
    };


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'padding' : undefined)}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={roomColor} size="large" />
                    </View>
                ) : posts.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: '20%' }}>
                        <Ionicons name="chatbubbles-outline" size={64} color={Colour.border} style={{ marginBottom: 16 }} />
                        <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary, fontSize: 16 }]}>No posts yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={posts}
                        inverted
                        keyExtractor={item => item.postID}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} tintColor={roomColor} />
                        }
                    />
                )}

                {/* Reply Preview */}
                {isMember ? (
                    <>
                        {/* Reply Preview */}
                        {replyingTo && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: Colour.card.backgroundColor,
                                padding: 10,
                                borderTopWidth: 1,
                                borderTopColor: Colour.border,
                            }}>
                                <View style={{ width: 4, height: '100%', backgroundColor: lightenColor(roomColor, 40), borderRadius: 2, marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Anaheim-Bold', fontSize: 13, color: roomColor }}>
                                        Replying to {replyingTo.userID === curruser.uid ? 'You' : replyingTo.username}
                                    </Text>
                                    <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 13, color: Colour.textSecondary }} numberOfLines={1}>
                                        {replyingTo.content}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                                    <Ionicons name="close-circle" size={20} color={Colour.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Edit Preview */}
                        {editingMessage && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: Colour.card.backgroundColor,
                                padding: 10,
                                borderTopWidth: 1,
                                borderTopColor: Colour.border,
                            }}>
                                <View style={{ width: 4, height: '100%', backgroundColor: roomColor, borderRadius: 2, marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Anaheim-Bold', fontSize: 13, color: roomColor }}>
                                        Editing Message
                                    </Text>
                                    <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 13, color: Colour.textSecondary }} numberOfLines={1}>
                                        {editingMessage.content}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => { setEditingMessage(null); setMessageText(''); }} style={{ padding: 4 }}>
                                    <Ionicons name="close-circle" size={20} color={Colour.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Input Area */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            padding: 12,
                            paddingBottom: isKeyboardVisible ? 12 : Math.max(12, insets.bottom),
                            borderTopWidth: 1,
                            borderTopColor: Colour.border,
                            backgroundColor: Colour.bg.backgroundColor,
                            marginBottom: Platform.OS === 'ios' ? 10 : 0
                        }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: Colour.card.backgroundColor,
                                    borderWidth: 1,
                                    borderColor: Colour.border,
                                    borderRadius: 20,
                                    paddingHorizontal: 16,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    maxHeight: 120,
                                    minHeight: 44,
                                    color: Colour.textPrimary,
                                    fontFamily: 'Anaheim-Regular',
                                    fontSize: 15
                                }}
                                placeholder="Message..."
                                placeholderTextColor={Colour.textSecondary}
                                multiline
                                value={messageText}
                                onChangeText={setMessageText}
                            />
                            <TouchableOpacity
                                style={{
                                    backgroundColor: roomColor,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: 10,
                                    marginBottom: 0
                                }}
                                onPress={handleSendMessage}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name={editingMessage ? "checkmark" : "send"} size={18} color="#fff" style={{ marginLeft: editingMessage ? 0 : 3 }} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={{
                        padding: 12,
                        paddingBottom: Math.max(12, insets.bottom),
                        borderTopWidth: 1,
                        borderTopColor: Colour.border,
                        backgroundColor: Colour.bg.backgroundColor,
                        marginBottom: Platform.OS === 'ios' ? 10 : 0
                    }}>
                        <TouchableOpacity
                            style={styles.joinBtn}
                            onPress={handleJoin}
                            disabled={joining}
                        >
                            {joining ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.joinBtnText}>Join Room to Chat</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Message Options Modal */}
            <Modal
                isVisible={isMessageOptionsVisible}
                onBackButtonPress={() => setIsMessageOptionsVisible(false)}
                onBackdropPress={() => setIsMessageOptionsVisible(false)}
                style={{ justifyContent: 'flex-end', margin: 0 }}
            >
                <View style={{ backgroundColor: Colour.card.backgroundColor, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colour.border, alignSelf: 'center', marginBottom: 20 }} />

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                        onPress={() => {
                            setReplyingTo(longPressedMessage);
                            setIsMessageOptionsVisible(false);
                        }}
                    >
                        <Ionicons name="arrow-undo-outline" size={24} color={Colour.textPrimary} style={{ marginRight: 16 }} />
                        <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 16, color: Colour.textPrimary }}>Reply</Text>
                    </TouchableOpacity>

                    {longPressedMessage && longPressedMessage.userID === curruser.uid && (
                        <>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                                onPress={() => {
                                    setEditingMessage(longPressedMessage);
                                    setMessageText(longPressedMessage.content);
                                    setIsMessageOptionsVisible(false);
                                    setReplyingTo(null);
                                }}
                            >
                                <Ionicons name="pencil-outline" size={24} color={Colour.textPrimary} style={{ marginRight: 16 }} />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 16, color: Colour.textPrimary }}>Edit Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                                onPress={handleDeleteMessage}
                            >
                                <Ionicons name="trash-outline" size={24} color="#F04452" style={{ marginRight: 16 }} />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 16, color: "#F04452" }}>Delete for everyone</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {longPressedMessage && longPressedMessage.userID !== curruser.uid && (
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                            disabled={reportedMessageIds.includes(longPressedMessage.postID)}
                            onPress={async () => {
                                try {
                                    await addDoc(collection(db, 'Reports'), {
                                        type: 'roomMessage',
                                        postID: longPressedMessage.postID,
                                        reportedUserID: longPressedMessage.userID,
                                        reportedByUserID: curruser.uid,
                                        createdAt: Date.now(),
                                        status: 'pending',
                                    });
                                    setReportedMessageIds(prev => [...prev, longPressedMessage.postID]);
                                    setIsMessageOptionsVisible(false);
                                } catch (e) { console.log(e) }
                            }}
                        >
                            <Ionicons name="warning-outline" size={24} color={reportedMessageIds.includes(longPressedMessage?.postID) ? (isDark ? '#5b2727' : '#aa4848') : "#F04452"} style={{ marginRight: 16 }} />
                            <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 16, color: reportedMessageIds.includes(longPressedMessage?.postID) ? (isDark ? '#5b2727' : '#aa4848') : "#F04452" }}>
                                {reportedMessageIds.includes(longPressedMessage?.postID) ? 'Reported' : 'Report Message'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>

            <AlertModal
                config={alertConfig}
                onClose={hideAlert}
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }}
                isDark={isDark}
            />
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: isDark ? '#333' : '#333' }}
                action={{
                    label: 'OK',
                    onPress: () => setSnackbarVisible(false),
                    textColor: '#fff'
                }}
            >
                <Text style={{ color: '#fff', fontFamily: 'Anaheim-SemiBold' }}>{snackbarMessage}</Text>
            </Snackbar>
        </SafeAreaView>
    );
}



