// REPORT PENDING








import {
    FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
    useWindowDimensions, KeyboardAvoidingView, Platform, TextInput,
    Pressable
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTheme } from './Theme'
import RenderHtml from 'react-native-render-html'
import Modal from 'react-native-modal';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

import { getDoc, doc, updateDoc, increment, deleteField, onSnapshot, collection, query, orderBy, addDoc } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import PopUp from './PopUp'
import { Divider, } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const Card = ({ item, curruser }) => {
    const { isDark, TEXT, Colour } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    const [popupvisible, setPopUpVisible] = React.useState(false);

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isPostLiked, setIsPostLiked] = useState(false);
    const [currpostcomment, setCurrPostComment] = useState('');
    const [comments, setComments] = useState([]);
    const [commentid, setCommentID] = useState('');
    const [userid, setUserID] = useState('');

    const [iscommentmodaloption, setIsCommentModalOption] = useState(false);
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
        // getComments();
    }, [item?.likedby, curruser]);

    useEffect(() => {
        const commentsRef = collection(
            db,
            'posts',
            item.postID,
            'comments'
        );

        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const commentsData = await Promise.all(
                snapshot.docs.map(async (commentDoc) => {
                    const data = commentDoc.data();

                    const userSnap = await getDoc(
                        doc(db, 'users', data.userID)
                    );

                    return {
                        id: commentDoc.id,
                        comment: data.comment,
                        userID: data.userID,
                        createdAt: data.createdAt,
                        username: userSnap.exists()
                            ? userSnap.data().username
                            : 'Unknown User',
                        fullName: userSnap.exists()
                            ? userSnap.data().fullname
                            : 'Unknown User',
                        pic: userSnap.exists()
                            ? userSnap.data().image
                            : null,
                    };
                })
            );

            setComments(commentsData);
        });

        return () => unsubscribe();
    }, [item.postID]);

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
            backgroundColor: isDark ? '#717171ff' : '#d7d7d7',
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
        commentEntry: {
            backgroundColor: isDark ? '#474747ff' : "#bcbcbc",
            borderWidth: 1,
            width: '83%',
            height: 40,
            borderRadius: 10,
            fontFamily: 'Anaheim-Regular',
            color: isDark ? '#fff' : '#000'
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        text: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 15
        }
    });

    const postComment = async (postId) => {
        try {
            if (!currpostcomment.trim()) return;

            await addDoc(
                collection(db, 'posts', postId, 'comments'),
                {
                    userID: curruser,
                    comment: currpostcomment.trim(),
                    createdAt: Date.now(),
                }
            );

            await updateDoc(doc(db, 'posts', postId), {
                totcomments: increment(1),
            });

            setCurrPostComment('');
        } catch (err) {
            console.log(err);
        }
    };

    const createdAt = (time) => {
        const dateObj = new Date(time);
        const timestr = dateObj.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return timestr
    }

    const renderComments = ({ item }) => {
        console.log(item)
        return (
            <Pressable onLongPress={() => { setIsCommentModalOption(true); setCommentID(item.id); setUserID(item.userID) }}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    padding: pressed ? 5 : 0
                })}>
                <View style={{ flexDirection: 'row', width: '100%', padding: 8, alignItems: 'center', }}>
                    <View style={{ width: '12%' }}>
                        <Image source={{ uri: item.pic }} style={{ height: 35, width: 35, borderRadius: 8, }} />
                    </View>

                    <View style={{ width: '80%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[TEXT.usernametxt, { fontSize: 12 },]}>{item.username}</Text>
                            <Text style={[TEXT.usernametxt, { fontSize: 12, color: isDark ? 'gray' : '#7b7b7b', fontFamily: 'Anaheim-SemiBold' },]}>{createdAt(item?.createdAt)}</Text>
                        </View>
                        <Text style={[TEXT.usernametxt, { fontSize: 10 },]} >{item.fullName} </Text>
                    </View>
                </View >

                <View style={{ marginLeft: 10, marginBottom: 8, }} >
                    <Text style={{ fontFamily: 'Anaheim-Regular', color: isDark ? '#fff' : '#000', }} > {item.comment} </Text>
                </View>

                <Divider style={{ height: 1, backgroundColor: isDark ? "#252525" : '#8a8a8a', width: '90%', alignSelf: 'center' }} />
            </Pressable >
        );
    };

    const handleOpenOtherUserID = (userid) => {
        if (userid == curruser) {
            navi.navigate('Profile');
        }
        else {
            navi.navigate('OtherProfile', { uid: userid });
        }
    }

    return (
        <View style={styles.outerContainer}>
            {/* HEADER */}
            <View style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 5 }}>
                {/* PROFILE PIC */}
                <TouchableOpacity onPress={() => handleOpenOtherUserID(item?.userID)} style={{ flexDirection: 'row' }}>
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
                animationIn={'slideInUp'}
                onBackButtonPress={() => setIsCommentModalVisible(false)}
                onBackdropPress={() => setIsCommentModalVisible(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end', width: '98%', alignSelf: 'center', }} >

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ backgroundColor: isDark ? '#474747ff' : "#bcbcbc", flex: 1, maxHeight: '80%', height: '80%', borderTopLeftRadius: 10, borderTopRightRadius: 10, bottom: -19 }}>
                    <View style={{ alignItems: 'center', marginTop: 5 }}>
                        <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold', fontSize: 25 }}>Comments</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={comments}
                            renderItem={renderComments}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            style={{ height: '82%', width: '100%' }}
                            ListEmptyComponent={() => (
                                <View style={{ flex: 1, alignItems: 'center', marginTop: 200, }} >
                                    <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold', }} >No comments yet</Text>
                                </View>
                            )}
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            padding: 10,
                            borderTopWidth: 1,
                            alignSelf: 'center',
                            justifyContent: 'center',
                            borderTopColor: isDark ? '#333' : '#999',
                        }}
                    >
                        <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                placeholder='Your comments?'
                                multiline
                                placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                                value={currpostcomment}
                                onChangeText={setCurrPostComment}
                                style={styles.commentEntry} />
                            <TouchableOpacity style={{ marginTop: 7, marginLeft: 10 }} onPress={() => postComment(item?.postID)} >
                                <Ionicons name="send" size={22} color={isDark ? "#06ec06ff" : "#02ae02"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal isVisible={iscommentmodaloption}
                animationIn={'slideInUp'}
                onBackButtonPress={() => setIsCommentModalOption(false)}
                onBackdropPress={() => setIsCommentModalOption(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end', width: '98%', alignSelf: 'center', }} >
                <View style={{ backgroundColor: isDark ? '#474747ff' : "#bcbcbc", height: 'auto', minHeight: 60, borderTopLeftRadius: 10, borderTopRightRadius: 10, bottom: -19, padding: 15 }}>
                    <TouchableOpacity onPress={() => navi.navigate('OtherProfile', { uid: userid })} style={[styles.option, { marginBottom: 15 }]} activeOpacity={0.7} >
                        <View style={styles.row}>
                            <FontAwesome name={'user'} size={22} color={isDark ? "#fff" : '#000'} />
                            <Text style={[styles.text, { color: isDark ? "#fff" : '#000', }]} >View Profile</Text>
                        </View>
                    </TouchableOpacity>
                    {
                        userid == user.uid && (
                            <>
                                <TouchableOpacity style={[styles.option, { marginBottom: 15 }]} activeOpacity={0.7} >
                                    <View style={styles.row}>
                                        <MaterialIcons name="edit" size={22} color={isDark ? "#fff" : '#000'} />
                                        <Text style={[styles.text, { color: isDark ? "#fff" : '#000', },]} >Edit</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.option, { marginBottom: 15 }]} activeOpacity={0.7} >
                                    <View style={styles.row}>
                                        <MaterialIcons name="delete" size={22} color="#FF2F32" />
                                        <Text style={[styles.text, { color: '#FF2F32', },]} >Delete</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )
                    }
                    <TouchableOpacity style={[styles.option, { marginBottom: 15 }]} activeOpacity={0.7} >
                        <View style={styles.row}>
                            <MaterialIcons name="report" size={22} color="#FF2F32" />
                            <Text style={[styles.text, { color: '#FF2F32', },]} >Report</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    )
}

export default Card;