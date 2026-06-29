import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, getDocs, writeBatch, arrayRemove } from 'firebase/firestore';
import Feather from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import Modal from 'react-native-modal';

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


    const profilecard = isDark ? '#5c5c5cff' : '#929292ff'
    const fontcolor = isDark ? '#fff' : '#000';

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
        postfrndreqcard:
        {
            backgroundColor: isDark ? '#6d6d6dff' : '#bebebeff',
            borderTopRightRadius: 15,
            borderBottomRightRadius: 20,
            justifyContent: 'center',
            marginLeft: '2.5%',
            alignItems: 'center',
            marginVertical: 5,
            width: 75
        },
        header:
        {
            width: '75%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '3%',
            gap: 15,
        },
        postfrndreqcardshare:
        {
            backgroundColor: isDark ? '#1c1c1c' : '#989898',
            justifyContent: 'center',
            marginLeft: '2.5%',
            alignItems: 'center',
            marginVertical: 5,
            width: 75,
            padding: 5,
            borderRadius: 10
        },
    })

    return (
        <SafeAreaView style={{ backgroundColor: isDark ? "#252525" : "#f6f6f6", flex: 1, alignItems: 'center' }}>
            <StatusBar barStyle={'dark-content'} />
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', paddingLeft: '6%', marginBottom: 15 }}>
                {/* HEADER */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* APP NAME */}
                    <TouchableOpacity onPress={() => navi.goBack()}>
                        <Feather name="arrow-left" size={24} color={isDark ? "#fff" : '#000'} />
                    </TouchableOpacity>
                    <Text style={[TEXT.heading, { fontSize: 22, fontFamily: 'Anaheim-Bold' }]}>{value?.username ?? 'Unknown user'}</Text>
                </View>
            </View>
            <ScrollView style={{ width: '96%', }}>
                <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: profilecard, width: '95%', borderTopRightRadius: 20, borderTopLeftRadius: 20, gap: 10 }}>
                        <Image
                            source={{ uri: imageUri }}
                            style={PROFILEPIC.ProfileScreenpic}
                        />
                        <View style={{ height: 75, width: '70%' }}>
                            <Text style={{ color: '#fff', marginTop: 10, fontFamily: 'Anaheim-Bold' }}>{value?.fullname}</Text>
                            <Text style={[TEXT.neonText, {}]}>{value?.neotext}</Text>
                        </View>
                    </View>
                    <View style={{ backgroundColor: profilecard, flexDirection: 'row', width: '95%', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, minHeight: 70, justifyContent: 'space-between', marginTop: '0.3%' }}>
                        <View style={[styles.postfrndreqcard, { borderBottomLeftRadius: 20, }]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.post ?? 0}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Posts</Text>
                        </View>
                        <View style={[styles.postfrndreqcard, { borderRadius: 20, width: 75 }]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.friends ?? 0}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', }} >Friends</Text>
                        </View>
                        <View style={[styles.postfrndreqcard, { marginRight: '2.5%', borderTopRightRadius: 0, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, width: 80 }]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.requests ?? 0}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Requests</Text>
                        </View>
                    </View>
                </View>
                <View id='bio' style={{ flex: 1, marginLeft: '5%', marginTop: '5%' }}>
                    {
                        value?.bio ?
                            (
                                fullbio ?
                                    <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Regular' }} onPress={() => setFullBio(!fullbio)}>{value?.bio}</Text>
                                    : <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Regular' }} numberOfLines={3} onPress={() => setFullBio(!fullbio)}>{value?.bio}</Text>
                            )
                            : <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Regular' }}>Nothing to look up here 😢</Text>
                    }
                </View>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginHorizontal: '3%', marginTop: 17 }}>
                    <TouchableOpacity onPress={inFriends ? handleRemoveFromFriends : friendsrequestsent ? handleCancelFriendRequest : handleFriendRequest} style={PROFILEPIC.editsharebtn}>
                        <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>{inFriends ? "Remove Friend" : friendsrequestsent ? 'Cancel' : 'Add as Friend'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsProfileVisible(true)} style={PROFILEPIC.editsharebtn}>
                        <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>Profile Card</Text>
                    </TouchableOpacity>

                </View>
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
                <View style={{ width: '90%', height: '38%', backgroundColor: isDark ? '#000000' : '#b6b6b6', borderRadius: 13, padding: 15 }}>
                    {/* HEADER */}
                    <View style={{ alignItems: 'center', marginTop: 10 }}>
                        <Image
                            source={{ uri: imageUri }}
                            style={[{ position: 'absolute', height: 85, width: 85, borderRadius: 25, borderWidth: 3, borderColor: isDark ? '#000' : '#fff', marginTop: '-25%' },]}
                        />
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[TEXT.usernametxt, { fontSize: 20, textAlign: 'center', marginTop: '7%' }]}>{value?.fullname}</Text>
                        <Text style={[TEXT.usernametxt, { fontSize: 16, textAlign: 'center', fontFamily: 'Anaheim-SemiBold' }]}>{"@" + value?.username}</Text>
                        <Text numberOfLines={3} style={[TEXT.usernametxt, { fontSize: 14, textAlign: 'center', fontFamily: 'Anaheim-Regular' }]}>{value?.bio}</Text>
                    </View>
                    <View style={{ alignItems: 'center', marginTop: 15, justifyContent: 'space-between', flexDirection: 'row', }}>
                        <View style={[styles.postfrndreqcardshare,]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.post}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Posts</Text>
                        </View>
                        <View style={[styles.postfrndreqcardshare,]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.friends}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', }} >Friends</Text>
                        </View>
                        <View style={[styles.postfrndreqcardshare, { marginRight: '2.5%', }]}>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.requests}</Text>
                            <Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Requests</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', marginTop: '3.5%', gap: 10 }}>
                        <TouchableOpacity onPress={inFriends ? handleRemoveFromFriends : friendsrequestsent ? handleCancelFriendRequest : handleFriendRequest} style={[PROFILEPIC.editsharebtn, { backgroundColor: isDark ? '#1c1c1c' : '#989898', flex: 1 }]}>
                            <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>{inFriends ? "Remove Friend" : friendsrequestsent ? 'Cancel' : 'Add as Friend'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ maxWidth: '100%', marginTop: '5%' }}>
                    <Text style={[TEXT.neonText, { fontSize: 25, textAlign: 'center' }]}>{value?.neotext ? value?.neotext.trim() : ''}</Text>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default OtherProfile