import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import AlertModal from '../utils/AlertModal';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, getDocs, writeBatch, arrayRemove, query, where } from 'firebase/firestore';
import Feather from 'react-native-vector-icons/Feather';
import { getUserData } from '../utils/UserCache';
import { BlurView } from '@react-native-community/blur';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '../services/firebaseAuth'
import { db } from '../services/firebaseAuth'

import { useTheme } from '../utils/Theme'
import { useNavigation, useRoute } from '@react-navigation/native';

const OtherProfile = () => {

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


    const { isDark, PROFILEPIC, TEXT, Colour } = useTheme();

    const route = useRoute();
    const uid = route?.params?.uid;

    const batch = writeBatch(db);

    const curruser = auth.currentUser;

    const [imageUri, setImageUri] = useState()
    const [value, setValue] = useState(null);
    const [fullbio, setFullBio] = useState(false)
    const [friendsrequestsent, setFriendsRequestSent] = useState(false);
    const [inFriends, setInFriends] = useState(false);

    const [isprofilevisible, setIsProfileVisible] = useState(false);
    
    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
    const [invitableRooms, setInvitableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // NEW STATES FOR BLOCK / REPORT
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);

    const bg = isDark ? '#121214' : '#F7F7FA';
    const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
    const border = isDark ? '#2E2E33' : '#E7E7ED';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
    const accent = isDark ? '#cdcdcd' : '#000000';
    const accentSoft = isDark ? '#232323' : '#E6F9EC';

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/"; // Update to your physical device IP if localhost fails

    const navi = useNavigation();

    const user = auth.currentUser;
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userData = await getUserData(uid);
                if (userData) {
                    setValue(userData);
                    if (userData.image) {
                        setImageUri(userData.image);
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchProfileData();
    }, [user, value]);

    useEffect(() => {
        const checkfriendfollowstatus = async () => {
            try {
                const friendsrequestcollection = await getDoc(doc(db, 'users', curruser.uid, 'Connect_RequestsSent', uid));
                const friendslist = await getDoc(doc(db, 'users', curruser.uid));
                const friendsarray = friendslist.data().friendslist;
                friendsarray.forEach((friendid) => {
                    if (friendid === uid) {
                        setInFriends(true);
                    }
                })
                if (friendsrequestcollection.exists() && friendsrequestcollection.data().status === 'pending') {
                    setFriendsRequestSent(true);
                }
                else {
                    setFriendsRequestSent(false)
                }
                const blockedUsers = friendslist.data().blockedUsers || [];
                setIsBlocked(blockedUsers.includes(uid));
            } catch (error) {
                console.log('asdjkgas')
            }
        }
        checkfriendfollowstatus();
    }, [uid])

    const handleRemoveFromFriends = async () => {
        try {
            setInFriends(false);
            setFriendsRequestSent(false);

            batch.update(doc(db, 'users', curruser.uid), {
                friendslist: arrayRemove(uid),
                friends: increment(-1),
            })
            batch.update(doc(db, 'users', uid), {
                friendslist: arrayRemove(curruser.uid),
                friends: increment(-1),
            })
            batch.commit();
        } catch (error) {
            console.log(error)
        }
    }

    const handleFriendRequest = async () => {
        try {
            setFriendsRequestSent(true);

            const currUserData = await getUserData(curruser.uid);
            const otherUserData = await getUserData(uid);
            
            const fromname = currUserData?.fullname;
            const fromusername = currUserData?.username;
            const toname = otherUserData?.fullname;
            const time = serverTimestamp();
            const fromprofile = currUserData?.image;

            await setDoc(doc(db, 'users', curruser.uid, 'Connect_RequestsSent', uid), {
                from: curruser.uid,
                to: uid,
                status: 'pending',
                fromname,
                toname,
                time,
            });
            await updateDoc(doc(db, 'users', curruser.uid), {
                requests: increment(1),
            })
            await setDoc(doc(db, 'users', uid, 'Connect_RequestsRecieved', curruser.uid), {
                from: curruser.uid,
                status: 'Pending',
                fromname,
                fromprofile,
                time,
                to: uid,
                fromusername,
            })
        } catch (error) {
            console.log(error)
        }
    }

    const handleCancelFriendRequest = async () => {
        try {
            setFriendsRequestSent(false);

            await deleteDoc(doc(db, 'users', curruser.uid, 'Connect_RequestsSent', uid));
            await deleteDoc(doc(db, 'users', uid, 'Connect_RequestsRecieved', curruser.uid));
            await updateDoc(doc(db, 'users', curruser.uid), {
                requests: increment(-1),
            })
        }
        catch (e) {
            console.log(e);
        }
    }

    const handleBlockUser = async () => {
        setIsSettingsVisible(false);
        try {
            if (isBlocked) {
                setIsBlocked(false);
                await updateDoc(doc(db, 'users', curruser.uid), {
                    blockedUsers: arrayRemove(uid)
                });
            } else {
                setIsBlocked(true);
                // Also remove from friends if blocked
                if (inFriends) handleRemoveFromFriends();
                if (friendsrequestsent) handleCancelFriendRequest();

                await setDoc(doc(db, 'users', curruser.uid), {
                    blockedUsers: [uid]
                }, { merge: true });
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleReportUser = async () => {
        setIsSettingsVisible(false);
        try {
            await addDoc(collection(db, 'Reports'), {
                type: 'user',
                reportedUserID: uid,
                reportedByUserID: curruser.uid,
                createdAt: Date.now(),
                status: 'pending',
            });
            showAlert("Success", "User has been reported to admins.");
        } catch (error) {
            console.log(error);
        }
    }

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

    const handleOpenInvite = async () => {
        setIsInviteModalVisible(true);
        setLoadingRooms(true);
        try {
            const roomsRef = collection(db, 'rooms');
            const q = query(roomsRef, where('members', 'array-contains', curruser.uid));
            const snapshot = await getDocs(q);
            const r = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.owner === curruser.uid || (data.admins && data.admins.includes(curruser.uid))) {
                    r.push({ id: docSnap.id, ...data });
                }
            });
            setInvitableRooms(r);
        } catch (e) {
            console.log(e);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleInviteSubmit = async (room) => {
        try {
            const token = await curruser.getIdToken();
            const res = await fetch(`${BACKEND_URL}inviteUserToRoom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ roomId: room.id, targetUid: uid })
            });
            const data = await res.json();
            if (data.success) {
                showAlert("Success", "Successfully invited user to " + room.name);
                setIsInviteModalVisible(false);
            } else {
                showAlert("Error", data.message);
            }
        } catch (e) {
            console.log(e);
            showAlert("Error", "Action failed.");
        }
    };


    const styles = StyleSheet.create({
        settingsView:
        {
            minHeight: '5.5%',
            flexDirection: 'row',
            width: '100%',
        },
        header:
        {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '4%',
            paddingTop: 6,
            gap: 10,
        },
        profileCard: {
            width: '92%',
            backgroundColor: cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            padding: '2%',
            alignSelf: 'center',
        },
        statBox: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
        },
        statDivider: {
            width: 1,
            backgroundColor: border,
            marginVertical: 6,
        },
        actionBtn: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: accentSoft,
        },
        modalStatBox: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
        }
    })

    return (
        <SafeAreaView style={{ backgroundColor: bg, flex: 1, alignItems: 'center' }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={22} color={fontcolor} />
                </TouchableOpacity>
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <Text style={[TEXT.heading, { fontSize: 20, }]}>{value?.username ?? 'Unknown user'} </Text>
                    {value?.isVerified && <MaterialIcons name="verified" size={16} color={Colour.accent} style={{marginLeft: 2, marginTop: -2}}/>}
                </View>
                <TouchableOpacity onPress={() => setIsSettingsVisible(true)}>
                    <Feather name="more-vertical" size={22} color={fontcolor} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', marginTop: 14 }} showsVerticalScrollIndicator={false}>
                {/* PROFILE CARD */}
                <View style={styles.profileCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={{ uri: imageUri }}
                            style={PROFILEPIC.ProfileScreenpic}
                        />
                        <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }} numberOfLines={1}>{value?.fullname}</Text>
                            <Text style={TEXT.neonText}>{value?.neotext}</Text>
                        </View>
                    </View>

                    {/* BIO */}
                    <View id='bio' style={{ marginTop: 0 }}>
                        {
                            value?.bio ?
                                (
                                    fullbio ?
                                        <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 14 }} onPress={() => setFullBio(!fullbio)}>{value?.bio}</Text>
                                        : <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 14 }} numberOfLines={3} onPress={() => setFullBio(!fullbio)}>{value?.bio}</Text>
                                )
                                : <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 14 }}>Nothing to look up here 😢</Text>
                        }
                    </View>

                    {/* STATS */}
                    <View style={{ flexDirection: 'row', marginTop: 14, backgroundColor: isDark ? '#232326' : '#F3F3F7', borderRadius: 14 }}>
                        <View style={styles.statBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.post ?? 0}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Posts</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <TouchableOpacity style={styles.statBox} onPress={() => navi.navigate('FriendsList', { friendsIds: value?.friendslist || [] })}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.friends ?? 0}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.requests ?? 0}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Requests</Text>
                        </View>
                    </View>

                    {/* ACTIONS */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <TouchableOpacity onPress={inFriends ? handleRemoveFromFriends : friendsrequestsent ? handleCancelFriendRequest : handleFriendRequest} style={styles.actionBtn}>
                            <Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>{inFriends ? "Remove Friend" : friendsrequestsent ? 'Cancel' : 'Add as Friend'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsProfileVisible(true)} style={styles.actionBtn}>
                            <Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>Profile Card</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleOpenInvite} style={styles.actionBtn}>
                            <Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>Invite to Room</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Profile Card */}
            <Modal
                isVisible={isprofilevisible}
                onBackButtonPress={() => setIsProfileVisible(false)}
                onBackdropPress={() => setIsProfileVisible(false)}
                hasBackdrop={true}
                backdropOpacity={1}
                customBackdrop={
                    <BlurView
                        style={{ flex: 1 }}
                        blurType={isDark ? "dark" : "light"}
                        blurAmount={5}
                        reducedTransparencyFallbackColor="white"
                    />
                }
                style={{ alignItems: 'center', justifyContent: 'center' }}
            >
                <View style={{ width: '88%', backgroundColor: cardBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border }}>
                    {/* HEADER */}
                    <View style={{ alignItems: 'center' }}>
                        <Image
                            source={{ uri: imageUri }}
                            style={{ height: 88, width: 88, borderRadius: 24, borderWidth: 3, borderColor: cardBg, marginTop: -60 }}
                        />
                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
                            <Text style={[TEXT.usernametxt, { fontSize: 19, textAlign: 'center', marginLeft: 0 }]}>{value?.fullname} </Text>
                            {value?.isVerified && <MaterialIcons name="verified" size={16} color={Colour.accent} />}
                        </View>
                        <Text style={{ color: accent, fontFamily: 'Anaheim-SemiBold', fontSize: 14 }}>{"@" + value?.username}</Text>
                        <Text numberOfLines={3} style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 13, textAlign: 'center', marginTop: 6 }}>{value?.bio}</Text>
                    </View>

                    {/* STATS */}
                    <View style={{ marginTop: 18, flexDirection: 'row', backgroundColor: isDark ? '#232326' : '#F3F3F7', borderRadius: 14 }}>
                        <View style={styles.modalStatBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.post}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Posts</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <TouchableOpacity style={styles.modalStatBox} onPress={() => { setIsProfileVisible(false); navi.navigate('FriendsList', { friendsIds: value?.friendslist || [] }); }}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.friends}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <View style={styles.modalStatBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.requests}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Requests</Text>
                        </View>
                    </View>

                    {/* ACTION */}
                    <View style={{ alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', marginTop: '3.5%', gap: 10 }}>
                        <TouchableOpacity onPress={inFriends ? handleRemoveFromFriends : friendsrequestsent ? handleCancelFriendRequest : handleFriendRequest} style={[PROFILEPIC.editsharebtn, { backgroundColor: isDark ? '#232326' : '#F3F3F7', flex: 1 }]}>
                            <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>{inFriends ? "Remove Friend" : friendsrequestsent ? 'Cancel' : 'Add as Friend'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ maxWidth: '100%', marginTop: 20 }}>
                    <Text style={[TEXT.neonText, { fontSize: 25, textAlign: 'center' }]}>{value?.neotext ? value?.neotext.trim() : ''}</Text>
                </View>
            </Modal>

            {/* Invite Modal */}
            <Modal
                isVisible={isInviteModalVisible}
                onBackButtonPress={() => setIsInviteModalVisible(false)}
                onBackdropPress={() => setIsInviteModalVisible(false)}
                style={{ justifyContent: 'flex-end', margin: 0 }}
            >
                <View style={{ backgroundColor: cardBg, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 50 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <Text style={{ fontFamily: 'Anaheim-Bold', color: fontcolor, fontSize: 20 }}>Invite to Room</Text>
                        <TouchableOpacity onPress={() => setIsInviteModalVisible(false)} style={{ padding: 4, backgroundColor: isDark ? '#2E2E33' : '#E7E7ED', borderRadius: 20 }}>
                            <Feather name="x" size={20} color={fontcolor} />
                        </TouchableOpacity>
                    </View>
                    
                    {loadingRooms ? (
                        <Text style={{ color: mutedcolor, textAlign: 'center', marginTop: 40, fontFamily: 'Anaheim-SemiBold' }}>Loading your rooms...</Text>
                    ) : invitableRooms.length === 0 ? (
                        <Text style={{ color: mutedcolor, textAlign: 'center', marginTop: 40, fontFamily: 'Anaheim-SemiBold' }}>No eligible rooms found where you are an Admin or Owner.</Text>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {invitableRooms.map(room => {
                                const mCount = room.members ? room.members.length : 0;
                                return (
                                <View 
                                    key={room.id} 
                                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: stringToColor(room.id), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            {room.groupPic ? (
                                                <Image source={{ uri: room.groupPic }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                                            ) : (
                                                <Ionicons name="chatbubbles" size={20} color={'#fff'} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }} numberOfLines={1}>{room.name}</Text>
                                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 13 }}>{mCount} member{mCount !== 1 ? 's' : ''}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={{ backgroundColor: mCount >= 20 ? (isDark ? '#2E2E33' : '#E7E7ED') : accentSoft, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginLeft: 10 }}
                                        onPress={() => handleInviteSubmit(room)}
                                        disabled={mCount >= 20}
                                    >
                                        <Text style={{ color: mCount >= 20 ? mutedcolor : accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>
                                            {mCount >= 20 ? 'Full' : 'Invite'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )})}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        
            {/* Settings Modal */}
            <Modal isVisible={isSettingsVisible}
                animationIn={'slideInUp'}
                onBackButtonPress={() => setIsSettingsVisible(false)}
                onBackdropPress={() => setIsSettingsVisible(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end', margin: 0 }} >
                <View style={{ backgroundColor: cardBg, height: 'auto', minHeight: 60, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 30 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? '#3A3A40' : '#D8D8E0', alignSelf: 'center', marginTop: -4, marginBottom: 12 }} />
                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity style={{ paddingVertical: 12 }} activeOpacity={0.7} onPress={handleBlockUser} >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialIcons name="block" size={20} color="#F04452" />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: '#F04452' }}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ paddingVertical: 12 }} activeOpacity={0.7} onPress={handleReportUser} >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialIcons name="report" size={20} color="#F04452" />
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: '#F04452' }}>Report User</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        
            <AlertModal 
                config={alertConfig} 
                onClose={hideAlert} 
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }} 
                isDark={isDark} 
            />
        </SafeAreaView>
    )
}

export default OtherProfile