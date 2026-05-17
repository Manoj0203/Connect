import { Alert, StyleSheet, Text, TouchableOpacity, View, StatusBar, Image, FlatList, useWindowDimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import RenderHtml from 'react-native-render-html';
import Modal from 'react-native-modal'
import Card from '../utils/Card'

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';


import auth from '../services/firebaseAuth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, updateDoc, increment, deleteField, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';
import { ActivityIndicator } from 'react-native-paper';

export default function HomeScreen (){
	const navigation = useNavigation();
	const curruser = auth.currentUser;

	const {Colour, isDark, TEXTINPUT, BUTTON, TEXT} = useTheme();

	const [loading, setLoading] = useState(true);
	const [posts, setPosts] = useState([]);

	useEffect(() =>
	{
		const switchseetingup = async () =>
		{
			const docRef = doc(db, 'users', curruser.uid);
			const docSnap = await getDoc(docRef);
			if(docSnap.exists() && docSnap.data().isSetupComplete === false)
			{
				navigation.replace('SettingUp');
				return;
			}
		}
		switchseetingup();
	},[])

	useEffect(() =>
	{
		const switchtoauth = async () =>
		{
			const docRef = doc(db, 'users', curruser.uid);
			const docSnap = await getDoc(docRef);
			if(docSnap.exists() && docSnap.data().otpVerified === false && docSnap.data().authentication === true)
			{
				navigation.replace('Auth');
				return;
			}
		}
        switchtoauth();
	},[])

	useEffect(() =>
	{
		console.log(curruser)
		getPosts();
	}, []);

	const getPosts = async () =>
	{
		const postDocSnap = collection(db, 'posts');
		const quer = query(postDocSnap, orderBy('time', 'desc'), limit(55));

		const unsubscribe = onSnapshot(quer, async (snapshot) => {
			const posts = await Promise.all(
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
			setPosts(posts);
			setLoading(false);
		});
		return () => unsubscribe();

		// const querySnapShot = await getDocs(quer);

		// const allposts = await Promise.all(
		// 	querySnapShot.docs.map(async (postDoc) => {
		// 		const postData = postDoc.data();

		// 		const userSnap = await getDoc(doc(db, 'users', postData.userID));

		// 		return {
		// 			...postData,
		// 			username: userSnap.exists() ? userSnap.data().username : 'Unknown',
		// 			fullName: userSnap.exists() ? userSnap.data().fullname : 'Unknown',
		// 			pic: userSnap.exists() ? userSnap.data().image : null,
		// 		};
		// 	})
		// );

		// setPosts(allposts)
		// setLoading(false);
	}
  	

	const styles = StyleSheet.create({
		container: {
			backgroundColor:isDark?"#252525":"#fff",
			flex: 1,
		},
		header:
		{
			width:'100%',
			flexDirection:'row',
			alignItems:'center',
			justifyContent:'space-between',
			paddingHorizontal:'5%'

		},
		outerContainer: {
			backgroundColor:isDark?'#717171ff':'#cecece',
			width:'90%',
			alignSelf:'center',
			marginVertical:5,
			borderRadius:8,
		},
		image:{
			width:'95%',
			resizeMode:'cover',
			alignSelf:'center',
			borderRadius:8			
		},
		tagsStyles:{
			h1: {
				fontSize: 24,
				textAlign:'center',
				fontFamily: 'Anaheim-Bold',
				color:isDark?'#fff':'#000'
			},
			u: {
				textDecorationLine: 'underline',
				color:isDark?'#fff':'#000'
			},
			i: {
				fontStyle: 'italic',
				color:isDark?'#fff':'#000'
			},
			div:{
				fontFamily:'Anaheim-SemiBold',
				color:isDark?'#fff':'#000',
			}
		},
		baseStyle:{
            ...Colour.fontColor,
			fontSize:17,
			paddingHorizontal:13,
			color:isDark?'#fff':'#000'
        },
	});

	const renderPosts = ({item}) =>
	{
		return(
			<Card
			item={item}
			curruser={curruser.uid} />
		);
	}

	return(
		<View style={styles.container}>
			<StatusBar barStyle={'dark-content'} />
			{/* HEADER */}
			<View style={styles.header}>
				{/* APP NAME */}
				<Text style={TEXT.heading}>Connect</Text>
				{/* IN - APP NNOTIFICATION */}
				<TouchableOpacity>
					<AntDesign name="heart" size={24} color={isDark ? "#06ec06ff" : "#00cc00ff"} style={{}} />
				</TouchableOpacity>
			</View>
			{
				loading?
				<View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
					<ActivityIndicator size={'large'} color={isDark ? "#06ec06ff" : "#00cc00ff"} />
				</View>
				:
				<View style={{}}>
					<FlatList
						style={{height:'93.5%'}}
						data={posts}
						showsVerticalScrollIndicator={false}
						keyExtractor={(item) => item.postID}
						renderItem={renderPosts} />
				</View>
			}
		</View>
	)
}
