import { StyleSheet, Platform, Text, View, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth, { db } from '../services/firebaseAuth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ActivityIndicator } from 'react-native-paper';
import Modal from 'react-native-modal';
import AlertModal from '../utils/AlertModal';
import { getUserData } from '../utils/UserCache';

export default function RoomAboutScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { room: initialRoom } = route.params;
    const curruser = auth.currentUser;
    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();
    const isFocused = useIsFocused();

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

    const [room, setRoom] = useState(initialRoom);
    const [usersData, setUsersData] = useState({});
    const [loading, setLoading] = useState(true);

    const [newPassword, setNewPassword] = useState('');
    const [isLeaving, setIsLeaving] = useState(false);
    // Collapsible states
    const [showChangePassword, setShowChangePassword] = useState(false);

    // Modal states
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [memberOptionsVisible, setMemberOptionsVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const isOwner = room.owner === curruser.uid;
    const isAdmin = room.admins && room.admins.includes(curruser.uid);
    const canManage = isOwner || isAdmin;

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/";

    useEffect(() => {
        if (isFocused) {
            loadRoomData();
        }
    }, [isFocused]);

    const loadRoomData = async () => {
        try {
            const roomDoc = await getDoc(doc(db, 'rooms', initialRoom.id));
            if (roomDoc.exists()) {
                const updatedRoom = { ...roomDoc.data(), id: roomDoc.id };
                setRoom(updatedRoom);

                const newUsersData = {};
                for (let uid of updatedRoom.members || []) {
                    const userData = await getUserData(uid);
                    if (userData) {
                        newUsersData[uid] = userData;
                    }
                }
                setUsersData(newUsersData);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const callApi = async (endpoint, body) => {
        const token = await curruser.getIdToken();
        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        return await res.json();
    };

    const handleChangePassword = async () => {
        if (!newPassword.trim()) return;
        setLoading(true);
        try {
            const res = await callApi('changeRoomPassword', { roomId: room.id, newPassword });
            if (res.success) {
                showAlert("Success", "Password updated.");
                setNewPassword('');
                setShowChangePassword(false);
            } else {
                showAlert("Error", res.message);
            }
        } catch (e) {
            showAlert("Error", "Action failed.");
        } finally {
            setLoading(false);
        }
    };



    const handleRemoveUser = async (targetUid) => {
        setMemberOptionsVisible(false);
        showAlert("Confirm", "Remove this user?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive", onPress: async () => {
                    setLoading(true);
                    try {
                        const res = await callApi('removeUser', { roomId: room.id, targetUid });
                        if (res.success) {
                            loadRoomData();
                        } else {
                            showAlert("Error", res.message);
                        }
                    } catch (e) {
                        showAlert("Error", "Action failed.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handlePromote = async (targetUid) => {
        setMemberOptionsVisible(false);
        setLoading(true);
        try {
            await updateDoc(doc(db, 'rooms', room.id), {
                admins: arrayUnion(targetUid)
            });
            loadRoomData();
        } catch (e) {
            showAlert("Error", "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (targetUid) => {
        setMemberOptionsVisible(false);
        setLoading(true);
        try {
            await updateDoc(doc(db, 'rooms', room.id), {
                admins: arrayRemove(targetUid)
            });
            loadRoomData();
        } catch (e) {
            showAlert("Error", "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = () => {

        if (isOwner) {
            if (room.members && room.members.length > 1) {
                setDeleteModalVisible(true);
            } else {
                confirmLeaveRoom(true);
            }
        } else {
            confirmLeaveRoom(false);
        }
    };

    const confirmLeaveRoom = async (deleteIfOwner) => {
        setIsLeaving(true);
        setDeleteModalVisible(false);
        try {
            const res = await callApi('leaveRoom', { roomId: room.id, deleteIfOwner });
            if (res.success) {
                navigation.navigate('Tabs');
            } else {
                showAlert("Error", res.message);
            }
        } catch (e) {
            showAlert("Error", "Failed to leave room.");
        } finally {
            setIsLeaving(false);
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

    const sortedMembers = [...(room.members || [])].sort((a, b) => {
        const roleA = room.owner === a ? 0 : (room.admins?.includes(a) ? 1 : 2);
        const roleB = room.owner === b ? 0 : (room.admins?.includes(b) ? 1 : 2);
        if (roleA !== roleB) return roleA - roleB;

        const nameA = (usersData[a]?.fullname || usersData[a]?.username || "").toLowerCase();
        const nameB = (usersData[b]?.fullname || usersData[b]?.username || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const renderMember = (uid) => {
        const u = usersData[uid] || {};
        let role = "Member";
        if (room.owner === uid) role = "Owner";
        else if (room.admins && room.admins.includes(uid)) role = "Admin";

        const isMe = uid === curruser.uid;

        return (
            <TouchableOpacity
                key={uid}
                style={styles.memberRow}
                onLongPress={() => {
                    setSelectedMember({ uid, role, userObj: u });
                    setMemberOptionsVisible(true);
                }}
                delayLongPress={250}
            >
                <View style={styles.avatar}>
                    {u.image ? (
                        <Image source={{ uri: u.image }} style={styles.avatarImage} />
                    ) : (
                        <Ionicons name="person" size={20} color={Colour.textSecondary} />
                    )}
                </View>
                <View style={styles.memberInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[TEXT.usernametxt, { marginLeft: 0, color: Colour.textPrimary, fontSize: 16 }]}>
                            {u.fullname || "Unknown"}
                        </Text>
                        {role !== "Member" && (
                            <Text style={{ fontFamily: 'Anaheim-Bold', color: Colour.accent, fontSize: 13, marginLeft: 6 }}>
                                ({role})
                            </Text>
                        )}
                        {isMe && <Text style={{ fontFamily: 'Anaheim-SemiBold', color: Colour.textSecondary, fontSize: 13, marginLeft: 6 }}>(You)</Text>}
                    </View>
                    <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary, marginTop: 2 }]}>
                        @{u.username || "unknown"}
                    </Text>
                </View>
            </TouchableOpacity>
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
            paddingHorizontal: '5%',
            paddingBottom: 0,
        },
        backBtn: {
            marginRight: SPACING.md,
        },
        content: {
            padding: '5%',
            paddingBottom: 100,
        },
        aboutCard: {
            backgroundColor: Colour.card.backgroundColor,
            borderRadius: RADIUS.lg,
            alignItems: 'center',
            marginBottom: SPACING.lg,
            borderWidth: 1,
            borderColor: Colour.border,
            overflow: 'hidden',
        },
        groupPic: {
            width: 80,
            height: 80,
            borderRadius: 18,
            backgroundColor: stringToColor(room.id),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.md,
        },
        sectionTitle: {
            ...TEXT.subheading,
            color: Colour.textPrimary,
            marginBottom: SPACING.md,
            marginLeft: 0,
        },
        section: {
            marginBottom: SPACING.xl,
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
            marginBottom: SPACING.sm,
            marginTop: SPACING.md,
        },
        textInput: {
            flex: 1,
            color: Colour.textPrimary,
            fontFamily: 'Anaheim-SemiBold',
        },
        actionBtn: {
            backgroundColor: Colour.accent,
            borderRadius: RADIUS.md,
            paddingVertical: 12,
            alignItems: 'center',
            marginBottom: SPACING.md,
        },
        actionBtnText: {
            color: isDark ? '#000' : '#fff',
            fontFamily: 'Anaheim-Bold',
            fontSize: 14,
        },
        toggleBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: Colour.border,
        },
        toggleBtnText: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 16,
            color: Colour.textPrimary,
        },
        memberRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING.md,
            backgroundColor: Colour.card.backgroundColor,
            padding: SPACING.sm,
            borderRadius: RADIUS.md,
        },
        avatar: {
            width: 45,
            height: 45,
            borderRadius: 10,
            backgroundColor: Colour.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md,
            overflow: 'hidden',
        },
        avatarImage: {
            width: '100%',
            height: '100%',
        },
        memberInfo: {
            flex: 1,
        },
        actionBtns: {
            flexDirection: 'row',
        },
        iconBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: SPACING.sm,
            backgroundColor: Colour.accent + '20',
        },
        leaveBtn: {
            backgroundColor: '#FF2F32',
            borderRadius: RADIUS.md,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: SPACING.lg,
        },
        leaveBtnText: {
            color: '#fff',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
        }
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colour.textPrimary} />
                </TouchableOpacity>
                <Text style={[TEXT.heading, { color: Colour.textPrimary, flex: 1 }]}>About</Text>
            </View>

            <AlertModal
                visible={deleteModalVisible}
                isDark={isDark}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => confirmLeaveRoom(true)}
                title="Delete Room?"
                message={`As the owner, leaving this room will remove all other ${room.members?.length - 1} members and permanently delete the room. Are you sure?`}
                btnText="Delete Room"
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.aboutCard}>
                    {/* Banner Background */}
                    <View style={{ width: '100%', height: 65, backgroundColor: stringToColor(room.id) + '80' }} />

                    <View style={{ width: '100%', alignItems: 'center', marginTop: -44 }}>
                        <View style={[styles.groupPic, { borderWidth: 4, borderColor: Colour.card.backgroundColor, marginBottom: 10 }]}>
                            {room.groupPic ? (
                                <Image source={{ uri: room.groupPic }} style={{ width: 72, height: 72, borderRadius: 36 }} />
                            ) : (
                                <Ionicons name="chatbubbles" size={40} color={'#fff'} />
                            )}
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: '5%', paddingBottom: '6%', alignItems: 'center', width: '100%' }}>
                        <Text style={[TEXT.heading, { color: Colour.textPrimary, marginBottom: 4 }]}>{room.name}</Text>

                        {room.desc ? (
                            <Text style={[TEXT.detailsSideHeading, { color: Colour.textSecondary, textAlign: 'center', marginBottom: 16 }]}>{room.desc}</Text>
                        ) : <View style={{ height: 16 }} />}

                        {room.members && room.members.includes(curruser.uid) && (
                            <View style={{ backgroundColor: isDark ? '#2E2E33' : '#F3F3F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name={isOwner ? "star" : isAdmin ? "shield-checkmark" : "person"} size={14} color={Colour.textPrimary} style={{ marginRight: 6 }} />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', color: Colour.textPrimary, fontSize: 13 }}>
                                    My Role: {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* MEMBERS SHOWN FIRST */}
                <View style={styles.section}>
                    {(() => {
                        const isMember = room.members && room.members.includes(curruser.uid);
                        const membersToShow = isMember
                            ? sortedMembers
                            : sortedMembers.filter(uid => room.owner === uid || (room.admins && room.admins.includes(uid)));

                        return (
                            <>
                                <Text style={styles.sectionTitle}>
                                    {isMember ? `Members (${room.members?.length || 0})` : `Owner & Admins (${membersToShow.length})`}
                                </Text>
                                {!loading && membersToShow.map(uid => renderMember(uid))}
                            </>
                        );
                    })()}
                </View>

                {/* SETTINGS (COLLAPSIBLE) */}
                {canManage && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Room Settings</Text>

                        <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowChangePassword(!showChangePassword)}>
                            <Text style={styles.toggleBtnText}>Change Password</Text>
                            <Ionicons name={showChangePassword ? "chevron-up" : "chevron-down"} size={20} color={Colour.textPrimary} />
                        </TouchableOpacity>
                        {showChangePassword && (
                            <View>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="New Password"
                                        placeholderTextColor={Colour.textSecondary}
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>
                                <TouchableOpacity style={styles.actionBtn} onPress={handleChangePassword}>
                                    <Text style={styles.actionBtnText}>Update Password</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {room.members && room.members.includes(curruser.uid) && (
                    <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveRoom} disabled={isLeaving}>
                        {isLeaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.leaveBtnText}>Leave Room</Text>}
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* MEMBER OPTIONS POPUP */}
            <Modal
                isVisible={memberOptionsVisible}
                onBackButtonPress={() => setMemberOptionsVisible(false)}
                onBackdropPress={() => setMemberOptionsVisible(false)}
                animationIn="zoomIn"
                animationOut="zoomOut"
                animationInTiming={200}
                animationOutTiming={150}
                backdropOpacity={0}
                style={{ justifyContent: 'center', alignItems: 'center' }}
            >
                <View style={{
                    backgroundColor: isDark ? '#3d3d3d' : '#ffffff',
                    borderRadius: 14,
                    width: 200,
                    paddingVertical: 6,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                }}>
                    {selectedMember && (
                        <>
                            <TouchableOpacity
                                style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setMemberOptionsVisible(false);
                                    navigation.navigate('OtherProfile', { uid: selectedMember.uid });
                                }}
                            >
                                <Ionicons name="person-outline" size={20} color={isDark ? '#fff' : '#000'} />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: isDark ? '#fff' : '#000' }}>View Profile</Text>
                            </TouchableOpacity>

                            {canManage && selectedMember.role === "Member" && (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                    activeOpacity={0.7}
                                    onPress={() => handlePromote(selectedMember.uid)}
                                >
                                    <Ionicons name="shield-checkmark-outline" size={20} color={Colour.accent} />
                                    <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: Colour.accent }}>Promote to Admin</Text>
                                </TouchableOpacity>
                            )}

                            {isOwner && selectedMember.role === "Admin" && (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                    activeOpacity={0.7}
                                    onPress={() => handleDismiss(selectedMember.uid)}
                                >
                                    <Ionicons name="shield-half-outline" size={20} color="#FF9500" />
                                    <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: '#FF9500' }}>Dismiss Admin</Text>
                                </TouchableOpacity>
                            )}

                            {canManage && selectedMember.role !== "Owner" && selectedMember.uid !== curruser.uid && (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                    activeOpacity={0.7}
                                    onPress={() => handleRemoveUser(selectedMember.uid)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#FF2F32" />
                                    <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: '#FF2F32' }}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </Modal>

            <AlertModal
                config={alertConfig}
                onClose={hideAlert}
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }}
                isDark={isDark}
            />
        </SafeAreaView>
    );
}
