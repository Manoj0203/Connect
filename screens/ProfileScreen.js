import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import Modal from 'react-native-modal'

// ICON
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '../services/firebaseAuth'
import { db } from '../services/firebaseAuth'

import { useTheme } from '../utils/Theme'

const ProfileScreen = () => {

	const { isDark, PROFILEPIC, TEXT, Colour } = useTheme();

	const navi = useNavigation();

	const [imageUri, setImageUri] = useState()
	const [value, setValue] = useState(null);
	const [fullbio, setFullBio] = useState(false)

	const [isprofilevisible, setIsProfileVisible] = useState(false);

	const profilecard = isDark ? '#5c5c5cff' : '#929292ff'
	const fontcolor = isDark ? '#fff' : '#000';

	const user = auth.currentUser;

	useEffect(() => {
		if (!user) {
			console.log("No User")
			navi.replace('Login');
			return;
		}
		const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				if (data.image) {
					if (typeof data.image === 'string') {
						setImageUri(data.image);
					} else if (data.image.path) {
						setImageUri(data.image.path);
					}
				}
			}
			setValue(docSnap.data());
			console.log(`d ${docSnap.data()?.isVerified}`)
		})
		return () => unsubscribe();
	}, [])

	// useEffect(() => {
	//     const fetchProfileData = async () => {
	//         const user = auth.currentUser;
	//         if (!user) {
	//           console.log("No User")
	//             return;
	//         }

	//         try {
	//             const userDocRef = doc(db, 'users', user.uid);

	//             const docSnap = await getDoc(userDocRef);

	//             if (docSnap.exists()) {
	//                 const data = docSnap.data();

	//                 if (data.image) {
	// 					if (typeof data.image === 'string') {
	// 						setImageUri(data.image);
	// 					} else if (data.image.path) {
	// 						setImageUri(data.image.path);
	// 					}
	// 				}
	// 				setValue(data);
	//             }

	//         }
	// 		catch (e)
	// 		{
	//             console.error("Error fetching profile: ", e);
	//         }
	//     };

	//     fetchProfileData();
	// }, []);

	const styles = StyleSheet.create({
		settingsView:
		{
			justifyContent: 'space-between',
			minHeight: '5.5%',
			flexDirection: 'row',
			width: '100%',
			justifyContent: 'space-between',
		},
		postfrndreqcard:
		{
			borderTopRightRadius: 15,
			borderBottomRightRadius: 20,
			width: 75,
			marginVertical: 5,
			backgroundColor: isDark ? '#6d6d6dff' : '#bebebeff',
			marginLeft: '2.5%',
			justifyContent: 'center',
			alignItems: 'center'
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
		}
	})
	return (
		<View style={{ backgroundColor: isDark ? "#252525" : "#fff", flex: 1, alignItems: 'center' }}>
			<StatusBar barStyle={'dark-content'} />
			<View style={styles.settingsView}>
				<View style={{ width: '80%', flexDirection: 'row', alignItems: 'center' }}>
					<Text style={TEXT.usernametxt}>{value?.username}</Text>
					{
						value?.isVerified && (
							<MaterialIcons name="verified" size={18} color={isDark ? "#06ec06ff" : '#00cc00ff'} style={{ marginLeft: '2%', marginTop: 5 }} />
						)
					}
				</View>
				<View style={{ width: '20%', alignItems: 'center', justifyContent: 'center' }}>
					<TouchableOpacity onPress={() => navi.navigate('Settings')}>
						<Ionicons name="settings" size={24} color={isDark ? '#fff' : '#000'} style={{ marginRight: '5%' }} />
					</TouchableOpacity>
				</View>
			</View>
			<ScrollView style={{ width: '96%', }}>
				<View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
					<View style={{ flexDirection: 'row', backgroundColor: profilecard, width: '95%', borderTopRightRadius: 20, borderTopLeftRadius: 20, gap: 10 }}>
						<Image
							source={{ uri: imageUri }}
							style={PROFILEPIC.ProfileScreenpic}
						/>
						<View style={{ height: 75, width: '75%' }}>
							<Text style={{ color: '#fff', marginTop: 10, fontFamily: 'Anaheim-Bold' }}>{value?.fullname}</Text>
							<Text style={[[TEXT.neonText, {}]]}>{value?.neotext}</Text>
						</View>
					</View>
					<View style={{ backgroundColor: profilecard, flexDirection: 'row', width: '95%', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, minHeight: 70, justifyContent: 'space-between', marginTop: '0.3%' }}>
						<View style={[styles.postfrndreqcard, { borderBottomLeftRadius: 20, }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17 }}>{value?.post}</Text>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Posts</Text>
						</View>
						<View style={[styles.postfrndreqcard, { borderRadius: 20, }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17 }}>{value?.friends}</Text>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Friends</Text>
						</View>
						<View style={[styles.postfrndreqcard, { marginRight: '2.5%', borderTopRightRadius: 0, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17 }}>{value?.requests}</Text>
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
					<TouchableOpacity onPress={() => navi.navigate('Edit')} style={PROFILEPIC.editsharebtn}>
						<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>Edit Profile</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setIsProfileVisible(true)} style={PROFILEPIC.editsharebtn}>
						<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-Bold' }}>Profile Card</Text>
					</TouchableOpacity>

				</View>
			</ScrollView>

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
				<View style={{ width: '90%', height: 'auto', backgroundColor: isDark ? '#000000' : '#b6b6b6', borderRadius: 13, padding: 15 }}>
					{/* HEADER */}
					<View style={{ alignItems: 'center', marginTop: 10 }}>
						<Image
							source={{ uri: imageUri }}
							style={[{ position: 'absolute', height: 85, width: 85, borderRadius: 25, borderWidth: 3, borderColor: isDark ? '#000' : '#fff', marginTop: '-25%' },]}
						/>
					</View>
					<View style={{ alignItems: 'center' }}>
						<View style={{ flexDirection: 'row', marginTop: '7%', alignItems: 'center' }}>
							<Text style={[TEXT.usernametxt, { fontSize: 20, textAlign: 'center', }]}>{value?.fullname}</Text>

							{
								value?.isVerified && (
									<MaterialIcons name="verified" size={15} color={isDark ? "#06ec06ff" : '#00cc00ff'} style={{ marginLeft: '2%', marginTop: 5 }} />

								)
							}
						</View>
						<Text style={[TEXT.usernametxt, { fontSize: 16, textAlign: 'center', fontFamily: 'Anaheim-SemiBold' }]}>{"@" + value?.username}</Text>
						<Text style={[TEXT.usernametxt, { fontSize: 14, textAlign: 'center', fontFamily: 'Anaheim-Regular' }]}>{value?.bio}</Text>
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
				</View>
				<View style={{ maxWidth: '100%', marginTop:'5%' }}>
					<Text style={[TEXT.neonText, {fontSize:25, textAlign:'center'}]}>{value?.neotext ? value?.neotext.trim() : ''}</Text>
				</View>
			</Modal>
		</View>
	)
}

export default ProfileScreen