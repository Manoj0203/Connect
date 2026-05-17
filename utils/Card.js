// REPORT PENDING








import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTheme } from './Theme'
import RenderHtml from 'react-native-render-html'
import Modal from 'react-native-modal';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

import { getDoc, doc, updateDoc, increment, deleteField, onSnapshot, } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';
import PopUp from './PopUp'
import { Divider, TextInput, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const Card = ({ item, curruser }) => {
    const { isDark, TEXT, Colour } = useTheme();
    const navi = useNavigation();

    const [popupvisible, setPopUpVisible] = React.useState(false);

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isPostLiked, setIsPostLiked] = useState(false);
    const [currpostcomment, setCurrPostComment] = useState('');
    const [comments, setComments] = useState([]);

    const [iscommentmodalvisible, setIsCommentModalVisible] = useState(false);

    const [fullName, setFullName] = useState(item?.fullNme)
    const [username, setUserName] = useState(item?.username)
    const [image, setImage] = useState(item?.pic)

    useEffect(() => {
        const unsubs = onSnapshot(doc(db, 'users', item.userID), (docSnap) => {
            setImage(docSnap.data().image)
            setFullName(docSnap.data().fullname)
            setUserName(docSnap.data().username)
        });
        return () => unsubs();
    }, [])

    // useEffect(() =>
    // {
    //     if(Object.keys(item?.likedby) == curruser)
    //     {
    //         setIsPostLiked(true)
    //     }
    //     getComments();
    // },[]);

    useEffect(() => {
        setIsPostLiked(!!item?.likedby?.[curruser]);
        getComments();
    }, [item?.likedby, curruser]);

    const getComments = async () => {
        const arr = Object.entries(item.comments || {}).map(
            ([userID, comment]) => ({ userID, comment })
        );

        const enriched = await Promise.all(
            arr.map(async (c) => {
                const userSnap = await getDoc(doc(db, 'users', c.userID));

                return {
                    ...c,
                    username: userSnap.exists() ? userSnap.data().username : 'Unknown user',
                    fullName: userSnap.exists() ? userSnap.data().fullname : 'Unknown user',
                    pic: userSnap.exists() ? userSnap.data().image : null,
                };
            })
        );
        setComments(enriched);
    }

    const handleLike = async (pid) => {
        const userDocSnap = await getDoc(doc(db, 'posts', pid?.postID));
        const likedByFieldPath = `likedby.${curruser}`;
        const likedpost = `postliked.${pid?.postID}`

        if (userDocSnap.exists()) {
            const data = userDocSnap.data().likedby;
            if (data[curruser]) {
                await updateDoc(doc(db, 'posts', pid?.postID), {
                    likes: increment(-1),
                    [likedByFieldPath]: deleteField()
                })
                await updateDoc(doc(db, 'users', curruser), {
                    [likedpost]: deleteField(),
                })
            }
            else {
                await updateDoc(doc(db, 'posts', pid?.postID), {
                    likes: increment(1),
                    [likedByFieldPath]: true
                })
                await updateDoc(doc(db, 'users', curruser), {
                    [likedpost]: true
                })
            }
        }

    }

    const styles = StyleSheet.create({
        outerContainer: {
            backgroundColor: isDark ? '#717171ff' : '#cecece',
            width: '95%',
            alignSelf: 'center',
            marginVertical: 5,
            borderRadius: 8,
        },
        tagsStyles: {
            h1: {
                fontSize: 24,
                textAlign: 'center',
                fontFamily: 'Anaheim-SemiBold',
                marginTop: -5,
                color: isDark ? '#fff' : '#000'
            },
            u: {
                textDecorationLine: 'underline',
                color: isDark ? '#fff' : '#000',
                fontFamily: 'Anaheim-SemiBold',
                marginTop: -5,
            },
            i: {
                fontStyle: 'italic',
                color: isDark ? '#fff' : '#000',
                fontFamily: 'Anaheim-SemiBold',
                marginTop: -5,
            },
            b: {
                fontFamily: 'Anaheim-Bold',
                marginTop: -5,
            },
            li: {
                color: isDark ? '#fff' : '#000',
                marginTop: -5,
                fontFamily: 'Anaheim-SemiBold',
            },
            div: {
                fontFamily: 'Anaheim-SemiBold',
                color: isDark ? '#fff' : '#000',
                fontSize: 18,
                paddingHorizontal: 5,
                marginTop: -5,
            }
        },
        baseStyle: {
            ...Colour.fontColor,
            paddingHorizontal: 13,
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
        },
    });

    const postComment = async (id) => {
        const commentByFieldPath = `comments.${curruser}`;
        try {
            await updateDoc(doc(db, 'posts', id), {
                totcomments: increment(1),
                [commentByFieldPath]: currpostcomment,
            })
            setCurrPostComment('');
        }
        catch (err) {
            console.log(err);
        }
    }

    const renderComments = ({ item, index }) => {
        return (
            <View>
                {/* HEADER */}
                <View style={{ flexDirection: 'row', width: '100%', padding: 8, alignItems: 'center' }}>
                    {/* PROFILE PIC */}
                    <View style={{ width: '10%' }}>
                        <Image
                            source={{ uri: item?.pic }}
                            style={{ height: 35, width: 35, borderRadius: 8 }} />
                    </View>

                    {/* NAME */}
                    <View style={{ width: '66%' }}>
                        <Text style={[TEXT.usernametxt, { fontSize: 12 }]}>{username}</Text>
                        <Text style={[TEXT.usernametxt, { fontSize: 10 }]}>{fullName}</Text>
                    </View>
                </View>

                {/* BODY */}
                <View style={{ marginLeft: 10, marginTop: 0 }}>
                    <Text style={{ fontFamily: 'Anaheim-Regular', color: isDark ? '#fff' : '#000' }}>{item?.comment}</Text>
                </View>
                <Divider />
            </View>
        )
    }

    const handleOpenOtherUserID = (userid) => {
        if(userid == curruser){
            navi.navigate('Profile');
        }
        else{
            navi.navigate('OtherProfile', { uid: userid });
        }
    }

    return (
        <View style={styles.outerContainer}>
            {/* HEADER */}
            <View style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 5 }}>
                {/* PROFILE PIC */}
                <TouchableOpacity onPress={() => handleOpenOtherUserID(item?.userID)} style={{flexDirection:'row'}}>
                    <View style={{ width: '14%' }}>
                    <Image
                        source={{ uri: image }}
                        style={{ height: 45, width: 45, borderRadius: 8 }} />
                </View>

                {/* NAME */}
                <View style={{ width: '80%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={[TEXT.usernametxt, { fontSize: 15 }]}>{username}</Text>
                            {
                                item?.verified && (
                                    <MaterialIcons name="verified" size={15} color={isDark ? "#06ec06ff" : '#00cc00ff'} style={{ marginLeft: '2%', marginTop: 5 }} />

                                )
                            }
                        </View>


                    </View>
                    <Text style={[TEXT.usernametxt, { fontSize: 12 }]}>{fullName}</Text>
                </View>
                </TouchableOpacity>

                {/* ACTION BUTTON */}
                <View style={{ marginTop: '0.5%' }}>
                    <TouchableOpacity onPress={() => setPopUpVisible(true)}>
                        <Entypo name="dots-three-vertical" size={18} color={isDark ? '#fff' : '#000'} style={{ marginTop: '20%' }} />
                    </TouchableOpacity>
                    <PopUp
                        id={125}
                        visible={popupvisible}
                        onClose={() => setPopUpVisible(false)}
                        isDark={isDark}
                        postUser={item?.userID}
                        curruser={curruser}
                        content={item?.content}
                        postId={item?.postID}
                        postImage={item?.image}
                    />
                </View>
            </View>

            {/* CONTENT */}
            <View style={{ padding: 5, paddingHorizontal: 8 }}>
                <Image
                    source={{ uri: item?.image }}
                    style={[styles.image, { height: (screenWidth * 0.9) * (item?.height / item?.width), borderRadius: 8, marginBottom: 5 }]} />
                <RenderHtml
                    contentWidth={screenWidth}
                    source={{ html: `${item?.content}` }}
                    baseStyle={[styles.baseStyle, {}]}
                    tagsStyles={styles.tagsStyles}
                    systemFonts={[
                        'Anaheim-Regular',
                        'Anaheim-Bold',
                        'Anaheim-SemiBold',
                        'impact',
                    ]}
                />
            </View>

            {/* FOOTER */}
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', gap: 10, marginHorizontal: 10, marginBottom: 5 }}>
                <View id='likes'>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => handleLike(item)}>
                        <Ionicons name="heart-circle" size={22}
                            style={{ marginTop: '-2%' }}
                            color={isPostLiked ? isDark ? "#06ec06ff" : "#00cc00ff" : isDark ? "#fff" : "#000"} />
                        {/* <FontAwesome
                            name={isPostLiked ? "heart" : "heart-o"}
                            size={18}
                            color={isPostLiked ? isDark ? "#06ec06ff" : "#00cc00ff" : "black"}
                        /> */}
                        <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#fff' : '#000', marginLeft: 5, marginRight: 10 }}>{item?.likes}</Text>
                    </TouchableOpacity>
                </View>

                <View id='Comments'>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsCommentModalVisible(true)}>
                        <MaterialIcons name="comment" size={21} color={isDark ? "#fff" : "#000"} />
                        <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#fff' : '#000', marginLeft: 5, marginRight: 10 }}>{item?.totcomments}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal isVisible={iscommentmodalvisible}
                animationIn={'rubberBand'}
                onBackButtonPress={() => setIsCommentModalVisible(false)}
                swipeDirection={'down'}
                onSwipeComplete={() => setIsCommentModalVisible(false)}
                onBackdropPress={() => setIsCommentModalVisible(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end' }} >

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ backgroundColor: isDark ? '#474747ff' : "rgba(188, 188, 188, 1)", flex: 1, maxHeight: '65%', height: '65%', borderRadius: 10, }}>
                    <View style={{ alignItems: 'center', marginTop: 5 }}>
                        <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold', fontSize: 25 }}>Comments</Text>
                    </View>

                    <View>
                        <FlatList
                            data={comments}
                            style={{ height: '82%', width: '100%' }}
                            renderItem={renderComments}
                            ListEmptyComponent={() => (
                                <View style={{ flex: 1, alignItems: 'center', marginTop: 200 }}>
                                    <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                                        No comments yet
                                    </Text>
                                </View>
                            )}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', alignSelf: 'center', gap: 5 }}>
                        <TextInput
                            placeholder='Your comments?'
                            placeholderTextColor={'#b5b5b5dc'}
                            value={currpostcomment}
                            onChangeText={(com) => setCurrPostComment(com)}
                            underlineColor={isDark ? '#474747ff' : "rgba(188, 188, 188, 1)"}
                            activeUnderlineColor={isDark ? '#474747ff' : "rgba(188, 188, 188, 1)"}
                            contentStyle={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Regular' }}
                            style={{ backgroundColor: isDark ? '#474747ff' : "rgba(188, 188, 188, 1)", borderWidth: 1, width: '83%', alignSelf: 'center', height: 40, borderRadius: 10, marginBottom: 10 }} />
                        <TouchableOpacity style={{ marginTop: 7, marginLeft: 10 }} onPress={() => postComment(item?.postID)} >
                            <Ionicons name="send" size={22} color={isDark ? "#06ec06ff" : "#00cc00ff"} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

export default Card;