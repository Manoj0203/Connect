// REPORT PENDING

import {
    FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
    useWindowDimensions, KeyboardAvoidingView, Platform, TextInput,
    Pressable
} from 'react-native'
import { optimizeCloudinaryUrl } from './Cloudinary';
import React, { useEffect, useState } from 'react'
import { useTheme } from './Theme'
import RenderHtml from 'react-native-render-html'
import Modal from 'react-native-modal';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

import { getDoc, doc, updateDoc, increment, deleteField, collection, query, orderBy, where, addDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import PopUp from './PopUp'
import { Divider, } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Card = ({ item, curruser }) => {
    const { isDark, TEXT, Colour } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    const [popupvisible, setPopUpVisible] = React.useState(false);

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isPostLiked, setIsPostLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(item?.likes || 0);
    const [currpostcomment, setCurrPostComment] = useState('');
    const [comments, setComments] = useState([]);
    const [commentid, setCommentID] = useState('');
    const [userid, setUserID] = useState('');
    const [reportedCommentIds, setReportedCommentIds] = useState([]);

    const [iscommentmodaloption, setIsCommentModalOption] = useState(false);
    const [iscommentmodalvisible, setIsCommentModalVisible] = useState(false);

    // NEW: edit-comment state
    const [iseditmodalvisible, setIsEditModalVisible] = useState(false);
    const [editCommentText, setEditCommentText] = useState('');

    const [isImageViewVisible, setIsImageViewVisible] = useState(false);

    const [fullName, setFullName] = useState(item?.fullName || item?.fullNme);
    const [username, setUserName] = useState(item?.username);
    const [image, setImage] = useState(item?.pic);
    const [areCommentsLoaded, setAreCommentsLoaded] = useState(false);

    const loadReports = async () => {
        try {
            const cacheKey = `reported_comments_${curruser}_${item.postID}`;
            const cachedStr = await AsyncStorage.getItem(cacheKey);
            
            if (cachedStr) {
                setReportedCommentIds(JSON.parse(cachedStr));
            } else {
                // Fetch reports from FB
                const reportsRef = collection(db, 'Reports');
                const qReports = query(
                    reportsRef,
                    where('reportedByUserID', '==', curruser),
                    where('postID', '==', item.postID)
                );
                const snapshotReports = await getDocs(qReports);
                const ids = snapshotReports.docs.map((d) => d.data().commentID);
                setReportedCommentIds(ids);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(ids));
            }

            setAreCommentsLoaded(true);
        } catch (error) {
            console.error("Error loading reports:", error);
        }
    };

    useEffect(() => {
        let unsubscribe = null;
        if (iscommentmodalvisible) {
            const commentsRef = collection(db, 'posts', item.postID, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'desc'));
            
            unsubscribe = onSnapshot(q, async (snapshot) => {
                const commentsData = await Promise.all(
                    snapshot.docs.map(async (commentDoc) => {
                        const data = commentDoc.data();
                        const userSnap = await getDoc(doc(db, 'users', data.userID));
                        return {
                            id: commentDoc.id,
                            comment: data.comment,
                            userID: data.userID,
                            createdAt: data.createdAt,
                            editedAt: data.editedAt || null,
                            username: userSnap.exists() ? userSnap.data().username : 'Unknown User',
                            fullName: userSnap.exists() ? userSnap.data().fullname : 'Unknown User',
                            pic: userSnap.exists() ? optimizeCloudinaryUrl(userSnap.data().image, 50) : null,
                            verified: userSnap.exists() ? userSnap.data().isVerified : false,
                        };
                    })
                );
                setComments(commentsData);
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [iscommentmodalvisible, item.postID]);

    useEffect(() => {
        if (iscommentmodalvisible && !areCommentsLoaded) {
            loadReports();
        }
    }, [iscommentmodalvisible]);

    useEffect(() => {
        setIsPostLiked(!!item?.likedby?.[curruser]);
        setLikeCount(item?.likes || 0);
    }, [item?.likedby, item?.likes, curruser]);

    const handleLike = async (pid) => {
        const currentlyLiked = isPostLiked;
        setIsPostLiked(!currentlyLiked);
        setLikeCount(prev => currentlyLiked ? prev - 1 : prev + 1);

        try {
            const userDocSnap = await getDoc(doc(db, 'posts', pid?.postID));
            const likedByFieldPath = `likedby.${curruser}`;
            const likedpost = `postliked.${pid?.postID}`;

            if (userDocSnap.exists()) {
                const data = userDocSnap.data().likedby || {};
                if (data[curruser]) {
                    await updateDoc(doc(db, 'posts', pid?.postID), {
                        likes: increment(-1),
                        [likedByFieldPath]: deleteField()
                    });
                    await updateDoc(doc(db, 'users', curruser), {
                        [likedpost]: deleteField(),
                    });
                }
                else {
                    await updateDoc(doc(db, 'posts', pid?.postID), {
                        likes: increment(1),
                        [likedByFieldPath]: true
                    });
                    await updateDoc(doc(db, 'users', curruser), {
                        [likedpost]: true
                    });
                }
            }
        } catch (error) {
            setIsPostLiked(currentlyLiked);
            setLikeCount(prev => currentlyLiked ? prev + 1 : prev - 1);
            console.log("Error liking post: ", error);
        }
    }

    const accent = isDark ? '#06ec06' : '#00B341';
    const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
    const borderCol = isDark ? '#2E2E33' : '#E7E7ED';
    const sheetBg = isDark ? '#1C1C1F' : '#FFFFFF';

    const styles = StyleSheet.create({
        outerContainer: {
            backgroundColor: cardBg,
            width: '94%',
            alignSelf: 'center',
            marginVertical: 6,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: borderCol,
            overflow: 'hidden',
        },
        tagsStyles: {
            h1: {
                fontSize: 22,
                textAlign: 'center',
                fontFamily: 'Anaheim-Bold',
                marginTop: -5,
                color: isDark ? '#F4F4F6' : '#17171B'
            },
            u: {
                textDecorationLine: 'underline',
                color: isDark ? '#F4F4F6' : '#17171B',
                fontFamily: 'Anaheim-SemiBold',
                marginTop: -5,
            },
            i: {
                fontStyle: 'italic',
                color: isDark ? '#F4F4F6' : '#17171B',
                fontFamily: 'Anaheim-SemiBold',
                marginTop: -5,
            },
            b: {
                fontFamily: 'Anaheim-Bold',
                marginTop: -5,
            },
            li: {
                color: isDark ? '#F4F4F6' : '#17171B',
                marginTop: -5,
                fontFamily: 'Anaheim-SemiBold',
            },
            div: {
                fontFamily: 'Anaheim-SemiBold',
                color: isDark ? '#F4F4F6' : '#17171B',
                fontSize: 16,
                paddingHorizontal: 0,
                marginTop: -5,
            }
        },
        baseStyle: {
            ...Colour.fontColor,
            paddingHorizontal: 0,
            color: isDark ? '#F4F4F6' : '#17171B',
            fontFamily: 'Anaheim-SemiBold',
            lineHeight: 21,
        },
        commentEntry: {
            backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
            borderWidth: 1,
            borderColor: borderCol,
            width: '83%',
            minHeight: 42,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingTop: 10,
            fontFamily: 'Anaheim-Regular',
            color: isDark ? '#F4F4F6' : '#17171B'
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        text: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 15
        },
        actionPill: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: isDark ? '#232326' : '#F3F3F7',
        },
        sheetHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: isDark ? '#3A3A40' : '#D8D8E0',
            alignSelf: 'center',
            marginTop: 10,
        },
        option: {
            paddingVertical: 12,
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
            <Pressable onLongPress={() => { setIsCommentModalOption(true); setCommentID(item.id); setUserID(item.userID); }}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: pressed ? (isDark ? '#232326' : '#F3F3F7') : 'transparent',
                    borderRadius: 12,
                })}>
                <View style={{ flexDirection: 'row', width: '100%', padding: 10, alignItems: 'center', }}>
                    <View style={{ width: 38 }}>
                        <Image source={{ uri: item.pic }} style={{ height: 36, width: 36, borderRadius: 10, }} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text numberOfLines={1} style={[TEXT.usernametxt, { fontSize: 13, paddingRight: 70, left: -13 }]}>
                                {item.username}{' '}
                                {item.verified && (
                                    <MaterialIcons name="verified" size={13} color={isDark ? '#06ec06' : '#00B341'} />
                                )}
                            </Text>
                            <Text style={{ fontSize: 11, color: isDark ? '#9A9AA5' : '#75758A', fontFamily: 'Anaheim-SemiBold', left: item?.editedAt ? -90 : 0 }}><Text>{item.editedAt ? '  (edited) ' : ''}</Text>{createdAt(item?.createdAt)}</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: isDark ? '#9A9AA5' : '#75758A', fontFamily: 'Anaheim-SemiBold', marginBottom: 4 }} >{item.fullName}</Text>
                        <Text style={{ fontFamily: 'Anaheim-Regular', color: isDark ? '#F4F4F6' : '#17171B', fontSize: 14 }}>
                            {item.comment}
                        </Text>
                    </View>
                </View >
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

    const handleReports = async () => {
        try {
            if (!commentid) return;
            if (reportedCommentIds.includes(commentid)) return; // already reported

            await addDoc(collection(db, 'Reports'), {
                type: 'comment',
                postID: item?.postID,
                commentID: commentid,
                reportedUserID: userid,
                reportedByUserID: curruser,
                createdAt: Date.now(),
                status: 'pending',
            });

            // Update local state and async storage
            const newIds = [...reportedCommentIds, commentid];
            setReportedCommentIds(newIds);
            
            const cacheKey = `reported_comments_${curruser}_${item?.postID}`;
            await AsyncStorage.setItem(cacheKey, JSON.stringify(newIds));

            setIsCommentModalOption(false);
        } catch (err) {
            console.log(err);
        }
    }

    // Deletes the selected comment and decrements the post's comment count.
    const handleDelete = async () => {
        try {
            if (!commentid) return;

            const commentRef = doc(db, 'posts', item.postID, 'comments', commentid);
            await deleteDoc(commentRef);

            await updateDoc(doc(db, 'posts', item.postID), {
                totcomments: increment(-1),
            });

            setIsCommentModalOption(false);
        } catch (err) {
            console.log(err);
        }
    }

    // Opens the edit sheet pre-filled with the selected comment's current text.
    const handleEdit = () => {
        const target = comments.find((c) => c.id === commentid);
        if (!target) return;

        setEditCommentText(target.comment);
        setIsCommentModalOption(false);
        setIsEditModalVisible(true);
    }

    // Persists the edited comment text back to Firestore.
    const updateComment = async () => {
        try {
            if (!editCommentText.trim() || !commentid) return;

            const commentRef = doc(db, 'posts', item.postID, 'comments', commentid);
            await updateDoc(commentRef, {
                comment: editCommentText.trim(),
                editedAt: Date.now(),
            });

            setEditCommentText('');
            setIsEditModalVisible(false);
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <View style={[styles.outerContainer, Colour.shadow, popupvisible && { overflow: 'visible', zIndex: 9999, elevation: 9999 }]}>
            {/* HEADER */}
            <View style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, alignItems: 'center', zIndex: 9999 }}>
                {/* PROFILE PIC */}
                <TouchableOpacity onPress={() => handleOpenOtherUserID(item?.userID)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image
                        source={
                            image
                                ? { uri: optimizeCloudinaryUrl(image, 100) }
                                : require("../assets/images/user.png")
                        }
                        style={{ height: 44, width: 44, borderRadius: 12 }}
                    />

                    {/* NAME */}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[TEXT.usernametxt, { fontSize: 15, paddingRight: 5, left: -14 }]} numberOfLines={1}>{username} </Text>
                            {
                                item?.verified && (
                                    <MaterialIcons name="verified" size={14} color={accent} style={{ marginLeft: -20 }} />
                                )
                            }
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: 'Anaheim-SemiBold', color: isDark ? '#9A9AA5' : '#75758A' }}>{fullName}</Text>
                    </View>
                </TouchableOpacity>

                {/* ACTION BUTTON */}
                <View style={{ zIndex: 9999 }}>
                    <TouchableOpacity onPress={() => setPopUpVisible(true)} style={{ padding: 6 }}>
                        <Entypo name="dots-three-vertical" size={16} color={isDark ? '#9A9AA5' : '#75758A'} />
                    </TouchableOpacity>
                    <PopUp
                        visible={popupvisible}
                        isDark={isDark}
                        onClose={() => setPopUpVisible(false)}
                        curruser={curruser}
                        postUser={item.userID}
                        content={item.content}
                        postImage={item.image}
                        postId={item.postID}
                        onEdit={() => navi.navigate('CreatePost', { editMode: true, post: item })}
                    />
                </View>
            </View>

            {/* CONTENT */}
            <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
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
            {
                item?.image && (
                    <>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsImageViewVisible(true)}>
                            <Image
                                source={{ uri: optimizeCloudinaryUrl(item.image, 800) }}
                                style={{ width: '100%', height: screenWidth * (item?.height / item?.width), marginTop: 4 }} />
                        </TouchableOpacity>
                        
                        <Modal
                            isVisible={isImageViewVisible}
                            onBackButtonPress={() => setIsImageViewVisible(false)}
                            onBackdropPress={() => setIsImageViewVisible(false)}
                            style={{ margin: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' }}
                            animationIn="fadeIn"
                            animationOut="fadeOut"
                        >
                            <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }} onPress={() => setIsImageViewVisible(false)}>
                                <Ionicons name="close" size={30} color="#fff" />
                            </TouchableOpacity>
                            <Image
                                source={{ uri: item.image }}
                                style={{ width: screenWidth, height: screenWidth * (item?.height / item?.width) }}
                                resizeMode="contain"
                            />
                        </Modal>
                    </>
                )
            }

            {/* FOOTER */}
            <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 12, marginVertical: 10 }}>
                <TouchableOpacity style={styles.actionPill} onPress={() => handleLike(item)}>
                    <Ionicons name={isPostLiked ? "heart" : "heart-outline"} size={18}
                        color={isPostLiked ? '#F04452' : (isDark ? "#F4F4F6" : "#17171B")} />
                    <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#F4F4F6' : '#17171B', marginLeft: 6, fontSize: 13 }}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => setIsCommentModalVisible(true)}>
                    <Ionicons name="chatbubble-outline" size={16} color={isDark ? "#F4F4F6" : "#17171B"} />
                    <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#F4F4F6' : '#17171B', marginLeft: 6, fontSize: 13 }}>{item?.totcomments}</Text>
                </TouchableOpacity>
            </View>

            <Modal isVisible={iscommentmodalvisible}
                animationIn={'slideInUp'}
                onBackButtonPress={() => setIsCommentModalVisible(false)}
                onBackdropPress={() => setIsCommentModalVisible(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end', margin: 0 }} >

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ backgroundColor: sheetBg, maxHeight: '82%', height: '82%', borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
                    <View style={styles.sheetHandle} />
                    <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                        <Text style={{ color: isDark ? '#F4F4F6' : '#17171B', fontFamily: 'Anaheim-Bold', fontSize: 18 }}>Comments</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={comments}
                            renderItem={renderComments}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 8 }}
                            style={{ width: '100%' }}
                            ListEmptyComponent={() => (
                                <View style={{ flex: 1, alignItems: 'center', marginTop: 100, }} >
                                    <Ionicons name="chatbubble-ellipses-outline" size={32} color={isDark ? '#4a4a52' : '#c7c7d1'} />
                                    <Text style={{ color: isDark ? '#9A9AA5' : '#75758A', fontSize: 15, fontFamily: 'Anaheim-Bold', marginTop: 8 }} >No comments yet</Text>
                                </View>
                            )}
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            padding: 12,
                            borderTopWidth: 1,
                            justifyContent: 'center',
                            borderTopColor: borderCol,
                        }}
                    >
                        <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 10, width: '100%', alignItems: 'flex-end' }}>
                            <TextInput
                                placeholder='Add a comment…'
                                multiline
                                placeholderTextColor={isDark ? '#9A9AA5' : '#75758A'}
                                value={currpostcomment}
                                onChangeText={setCurrPostComment}
                                style={styles.commentEntry} />
                            <TouchableOpacity
                                style={{ backgroundColor: accent, borderRadius: 999, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
                                onPress={() => postComment(item?.postID)} >
                                <Ionicons name="send" size={18} color="#fff" />
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
                style={{ justifyContent: 'flex-end', margin: 0 }} >
                <View style={{ backgroundColor: sheetBg, height: 'auto', minHeight: 60, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 10 }}>
                    <View style={styles.sheetHandle} />
                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity onPress={() => navi.navigate('OtherProfile', { uid: userid })} style={styles.option} activeOpacity={0.7} >
                            <View style={styles.row}>
                                <FontAwesome name={'user'} size={20} color={isDark ? "#F4F4F6" : '#17171B'} />
                                <Text style={[styles.text, { color: isDark ? "#F4F4F6" : '#17171B', }]} >View Profile</Text>
                            </View>
                        </TouchableOpacity>
                        {
                            userid == user.uid && (
                                <>
                                    <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleEdit} >
                                        <View style={styles.row}>
                                            <MaterialIcons name="edit" size={20} color={isDark ? "#F4F4F6" : '#17171B'} />
                                            <Text style={[styles.text, { color: isDark ? "#F4F4F6" : '#17171B', },]} >Edit</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleDelete} >
                                        <View style={styles.row}>
                                            <MaterialIcons name="delete" size={20} color="#F04452" />
                                            <Text style={[styles.text, { color: '#F04452', },]} >Delete</Text>
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )
                        }
                        {
                            userid != user.uid && (
                                <TouchableOpacity
                                    style={styles.option}
                                    activeOpacity={0.7}
                                    disabled={reportedCommentIds.includes(commentid)}
                                    onPress={handleReports}
                                >
                                    <View style={styles.row}>
                                        <MaterialIcons
                                            name="report"
                                            size={20}
                                            color={reportedCommentIds.includes(commentid) ? (isDark ? '#5b2727' : '#aa4848') : '#F04452'}
                                        />
                                        <Text
                                            style={[
                                                styles.text,
                                                { color: reportedCommentIds.includes(commentid) ? (isDark ? '#5b2727' : '#aa4848') : '#F04452' },
                                            ]}
                                        >
                                            {reportedCommentIds.includes(commentid) ? 'Reported' : 'Report'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                    </View>
                </View>
            </Modal>

            {/* EDIT COMMENT SHEET */}
            <Modal isVisible={iseditmodalvisible}
                animationIn={'slideInUp'}
                onBackButtonPress={() => setIsEditModalVisible(false)}
                onBackdropPress={() => setIsEditModalVisible(false)}
                hasBackdrop
                style={{ justifyContent: 'flex-end', margin: 0 }} >

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ backgroundColor: sheetBg, borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
                    <View style={styles.sheetHandle} />
                    <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                        <Text style={{ color: isDark ? '#F4F4F6' : '#17171B', fontFamily: 'Anaheim-Bold', fontSize: 18 }}>Edit Comment</Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            padding: 12,
                            paddingBottom: 20,
                            justifyContent: 'center',
                        }}
                    >
                        <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 10, width: '100%', alignItems: 'flex-end' }}>
                            <TextInput
                                placeholder='Edit your comment…'
                                multiline
                                autoFocus
                                placeholderTextColor={isDark ? '#9A9AA5' : '#75758A'}
                                value={editCommentText}
                                onChangeText={setEditCommentText}
                                style={styles.commentEntry} />
                            <TouchableOpacity
                                style={{ backgroundColor: accent, borderRadius: 999, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
                                onPress={updateComment} >
                                <Ionicons name="checkmark" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

export default Card;