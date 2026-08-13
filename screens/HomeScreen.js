import { StyleSheet, Text, TouchableOpacity, View, StatusBar, FlatList, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../utils/Card'

import auth from '../services/firebaseAuth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';
import { ActivityIndicator } from 'react-native-paper';

export default function HomeScreen() {
	const navigation = useNavigation();
	const curruser = auth.currentUser;

	const { Colour, isDark, TEXT } = useTheme();

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [posts, setPosts] = useState([]);

	useEffect(() => {
		if (!curruser) {
			navigation.replace('Signup');
		}
	})
	
	const switchsettingup = async () => {
		const docRef = doc(db, 'users', curruser.uid);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists() && docSnap.data().isSetupComplete === false) {
			navigation.replace('SettingUp');
			return;
		}
	}
	const switchtoauth = async () => {
		const docRef = doc(db, 'users', curruser.uid);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists() && docSnap.data().otpVerified === false && docSnap.data().authentication === true) {
			navigation.replace('Auth');
			return;
		}
	}

	useEffect(() => {
		switchsettingup();
		switchtoauth();
		getPosts();
	}, []);

	const getPosts = async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		
		try {
			const postDocSnap = collection(db, 'posts');
			const quer = query(postDocSnap, orderBy('time', 'desc'), limit(50));
			const snapshot = await getDocs(quer);
			
			const postsData = await Promise.all(
				snapshot.docs.map(async (docSnap) => {
					const post = docSnap.data();

					const userSnap = await getDoc(doc(db, 'users', post.userID));

					return {
						...post,
						postID: docSnap.id,
						username: userSnap.exists() ? userSnap.data().username : 'Unknown',
						fullName: userSnap.exists() ? userSnap.data().fullname : 'Unknown',
						pic: userSnap.exists() ? userSnap.data().image : null,
						verified: userSnap.exists() ? userSnap.data().isVerified : null,
					};
				})
			);
			// We only want to set posts if it's the initial load or a manual refresh.
			// The onSnapshot for my posts will handle merging.
			setPosts(prevPosts => {
				const merged = [...postsData];
				// Keep any posts from prevPosts that are mine (and might be newer if they were from onSnapshot)
				// Or simply trust the getDocs snapshot for others, and the next onSnapshot trigger will merge mine.
				return merged;
			});
		} catch (error) {
			console.error("Error fetching posts: ", error);
		} finally {
			setLoading(false);
			if (isRefresh) setRefreshing(false);
		}
	}

	useEffect(() => {
		const postDocSnap = collection(db, 'posts');
		const myQuer = query(postDocSnap, where('userID', '==', curruser.uid));

		const unsubscribe = onSnapshot(myQuer, async (snapshot) => {
			const myPostsData = await Promise.all(
				snapshot.docs.map(async (docSnap) => {
					const post = docSnap.data();
					const userSnap = await getDoc(doc(db, 'users', post.userID));
					return {
						...post,
						postID: docSnap.id,
						username: userSnap.exists() ? userSnap.data().username : 'Unknown',
						fullName: userSnap.exists() ? userSnap.data().fullname : 'Unknown',
						pic: userSnap.exists() ? userSnap.data().image : null,
						verified: userSnap.exists() ? userSnap.data().isVerified : null,
					};
				})
			);
			
			setPosts(prevPosts => {
				const newPosts = [...prevPosts];
				myPostsData.forEach(myPost => {
					const index = newPosts.findIndex(p => p.postID === myPost.postID);
					if (index !== -1) {
						newPosts[index] = myPost;
					} else {
						newPosts.unshift(myPost);
					}
				});
				return newPosts.sort((a, b) => b.time - a.time);
			});
		});

		return () => unsubscribe();
	}, [curruser.uid]);


	const styles = StyleSheet.create({
		container: {
			backgroundColor: isDark ? "#121214" : "#F7F7FA",
			flex: 1,
		},
		header:
		{
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 20,
			paddingTop: 0,
			paddingBottom: 10,
		},
		headerIconBtn: {
			width: 40,
			height: 40,
			borderRadius: 20,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: isDark ? '#1C1C1F' : '#fff',
			borderWidth: 1,
			borderColor: isDark ? '#2E2E33' : '#E7E7ED',
		},
		listContent: {
			paddingBottom: '20%',
			paddingTop: 4,
		},
		emptyState: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: 120,
		},
	});

	const renderPosts = ({ item }) => {
		return (
			<Card
				item={item}
				curruser={curruser.uid} />
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			{/* HEADER */}
			<View style={styles.header}>
				{/* APP NAME */}
				<Text style={TEXT.heading}>Connect</Text>
				{/* IN - APP NOTIFICATION */}
				<TouchableOpacity style={styles.headerIconBtn}>
					<Ionicons name="heart-outline" size={20} color={isDark ? "#F4F4F6" : "#17171B"} />
				</TouchableOpacity>
			</View>
			{
				loading ?
					<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
						<ActivityIndicator size={'large'} color={"#00B341"} />
					</View>
					:
					<FlatList
						data={posts}
						showsVerticalScrollIndicator={false}
						keyExtractor={(item) => item.postID}
						renderItem={renderPosts}
						contentContainerStyle={styles.listContent}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={() => getPosts(true)} tintColor={isDark ? '#F4F4F6' : '#17171B'} />
						}
						ListEmptyComponent={() => (
							<View style={styles.emptyState}>
								<Ionicons name="images-outline" size={40} color={isDark ? '#4a4a52' : '#c7c7d1'} />
								<Text style={{ marginTop: 10, fontFamily: 'Anaheim-SemiBold', color: isDark ? '#9A9AA5' : '#75758A' }}>
									No posts yet
								</Text>
							</View>
						)}
					/>
			}
		</SafeAreaView>
	)
}