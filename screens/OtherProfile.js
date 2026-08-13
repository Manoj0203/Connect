import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, getDocs, writeBatch, arrayRemove } from 'firebase/firestore';
import Feather from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '../services/firebaseAuth'
import { db } from '../services/firebaseAuth'

import { useTheme } from '../utils/Theme'
import { useNavigation, useRoute } from '@react-navigation/native';

const OtherProfile = () => {

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

    const bg = isDark ? '#121214' : '#F7F7FA';
    const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
    const border = isDark ? '#2E2E33' : '#E7E7ED';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
    const accent = isDark ? '#cdcdcd' : '#000000';
    const accentSoft = isDark ? '#232323' : '#E6F9EC';

    const navi = useNavigation();

    const user = auth.currentUser;
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userDocRef = doc(db, 'users', uid);

                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    if (data.image) {
                        setImageUri(data.image);
                    }
                    else {
                        console.log('Error')
                    }
                    setValue(data);
                }
            }
            catch (e) {
                console.error("Error fetching profile: ", e);
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

            const fromname = (await getDoc(doc(db, 'users', curruser.uid))).data().fullname;
            const fromusername = (await getDoc(doc(db, 'users', curruser.uid))).data().username;
            const toname = (await getDoc(doc(db, 'users', uid))).data().fullname;
            const time = serverTimestamp();
            const fromprofile = (await getDoc(doc(db, 'users', curruser.uid))).data().image;

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
                <Text style={[TEXT.heading, { fontSize: 20 }]}>{value?.username ?? 'Unknown user'}</Text>
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
                        <View style={styles.statBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.friends ?? 0}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
                        </View>
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
                        <Text style={[TEXT.usernametxt, { fontSize: 19, textAlign: 'center', marginTop: 12, marginLeft: 0 }]}>{value?.fullname}</Text>
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
                        <View style={styles.modalStatBox}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.friends}</Text>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
                        </View>
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
        </SafeAreaView>
    )
}

export default OtherProfile