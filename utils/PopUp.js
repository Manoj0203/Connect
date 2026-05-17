// UNCOMMENT WRITEBATCH FOR DECREMENTING THE POST COUNT









import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from 'react-native';
import { deleteDoc, doc, increment, writeBatch } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import Share from 'react-native-share';

import AlertModal from './AlertModal'

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PopUp = ({
    visible,
    isDark,
    onClose,
    curruser,
    postUser,
    content,
    postImage,
    postId
}) => {

    const animationFade = useRef(new Animated.Value(0)).current;
    const animationScale = useRef(new Animated.Value(0.85)).current;

    const batch = writeBatch(db);
    const user = auth.currentUser;

    const [modalVisible, setModalVisible] = useState(false);
    const [render, setRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setRender(true);

            Animated.parallel([
                Animated.timing(animationFade, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.spring(animationScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(animationFade, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(animationScale, {
                    toValue: 0.85,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setRender(false);
            });
        }
    }, [visible]);

    if (!render) return null;

    const handlehtmlcontent = (html) => {
        return html.replace(/<[^>]*>/g, '');
    };

    const shareImage = async () => {
        try {
            const options = {
                title: 'Connect',
                message: `${handlehtmlcontent(content)}\n`,
                url: postImage,
                type: 'image/jpg',
            };

            await Share.open(options);
        } catch (error) {
            console.log(error);
        }
    };

    const deletePost = async () => {
        setModalVisible(true);
    }

    const handleDelete = async () => {
        // firestore delete here
        console.log('Deleted');
        // await deleteDoc(doc(db, 'posts', postId));

        batch.delete(doc(db, 'posts', postId));
        batch.update(doc(db, 'users', user.uid), {
            post: increment(-1),
        })
        batch.commit();

        setModalVisible(false);
    };

    const handleShare = () => {

    }


    return (
        <>
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            />

            <Animated.View
                style={[
                    styles.popup,
                    {
                        backgroundColor: isDark
                            ? '#3d3d3d'
                            : '#fff',

                        opacity: animationFade,

                        transform: [
                            {
                                scale: animationScale,
                            },
                        ],
                    },
                ]}
            >

                <TouchableOpacity
                    style={styles.option}
                    activeOpacity={0.7}
                    onPress={shareImage}
                >
                    <View style={styles.row}>
                        <FontAwesome
                            name="share-square-o"
                            size={18}
                            color={isDark ? '#fff' : '#000'}
                        />

                        <Text
                            style={[
                                styles.text,
                                {
                                    color: isDark
                                        ? '#fff'
                                        : '#000',
                                },
                            ]}
                        >
                            Share
                        </Text>
                    </View>
                </TouchableOpacity>

                <AlertModal visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onConfirm={handleDelete}
                    isDark={isDark}
                />
                {
                    curruser === postUser && (
                        <TouchableOpacity
                            style={styles.option}
                            activeOpacity={0.7}
                            onPress={() => deletePost()}
                        >
                            <View style={styles.row}>
                                <MaterialIcons
                                    name="delete"
                                    size={22}
                                    color="#FF2F32"
                                />

                                <Text
                                    style={[
                                        styles.text,
                                        {
                                            color: '#FF2F32',
                                        },
                                    ]}
                                >
                                    Delete
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )
                }

                {
                    curruser !== postUser && (
                        <TouchableOpacity
                            style={styles.option}
                            activeOpacity={0.7}
                        >
                            <View style={styles.row}>
                                <MaterialIcons
                                    name="report"
                                    size={22}
                                    color="#FF2F32"
                                />

                                <Text
                                    style={[
                                        styles.text,
                                        {
                                            color: '#FF2F32',
                                        },
                                    ]}
                                >
                                    Report
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )
                }
            </Animated.View>
        </>
    );
};

export default PopUp;

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: -1000,
        bottom: -1000,
        left: -1000,
        right: -1000,
        zIndex: 998,
    },

    popup: {
        position: 'absolute',
        top: 28,
        right: 0,
        width: 140,
        borderRadius: 12,
        elevation: 10,
        zIndex: 999,
        paddingVertical: 6,
    },

    option: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    text: {
        fontSize: 15,
        fontWeight: '600',
    },
});