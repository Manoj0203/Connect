import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import Modal from 'react-native-modal'
import { BlurView } from '@react-native-community/blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '../services/firebaseAuth'
import { db } from '../services/firebaseAuth'

import { useTheme } from '../utils/Theme'
import { useNavigation } from '@react-navigation/native';
import { optimizeCloudinaryUrl } from '../utils/Cloudinary';

const ProfileScreen = () => {
	const navi = useNavigation();
	const { isDark, PROFILEPIC, TEXT, Colour } = useTheme();

	const batch = writeBatch(db);

	const [imageUri, setImageUri] = useState()
	const [value, setValue] = useState(null);
	const [refreshing, setRefreshing] = useState(false);
	const [fullbio, setFullBio] = useState(false)
	const [allreq_friends, setAllReq_friends] = useState([]);
	const [otherID, setOtherId] = useState(null);

	const [leavegrpcon, setLeaveGrpCon] = useState(false);
	const [isprofilevisible, setIsProfileVisible] = useState(false);

	const bg = isDark ? '#121214' : '#F7F7FA';
	const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
	const border = isDark ? '#2E2E33' : '#E7E7ED';
	const fontcolor = isDark ? '#F4F4F6' : '#17171B';
	const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
	const accent = isDark ? '#cdcdcd' : '#000000';
	const accentSoft = isDark ? '#232323' : '#E6F9EC';

	const navigation = useNavigation();

	const user = auth.currentUser;
	const fetchProfileData = async () => {
		const user = auth.currentUser;
		if (!user) {
			console.log("No User")
			return;
		}

		try {
			const userDocRef = doc(db, 'users', user.uid);

			const docSnap = await getDoc(userDocRef);

			if (docSnap.exists()) {
				const data = docSnap.data();

				if (data.image) {
					setImageUri(optimizeCloudinaryUrl(data.image, 150));
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

	const getPendingRequests_friends = async () => {
		try {
			let dumallreq = [];

			const frndsReqQuery = query(collection(db, 'users', user.uid, 'Connect_RequestsRecieved'), orderBy('time', 'asc'));
			const frndsReqSnap = await getDocs(frndsReqQuery);
			frndsReqSnap.docs.map((docs) => {
				dumallreq.push({
					fromname: docs.data().fromname,
					fromprofile: optimizeCloudinaryUrl(docs.data().fromprofile, 50),
					time: docs.data().time,
					fromusername: docs.data().fromusername,
					toID: docs.data().from,
				});
			})
			setAllReq_friends(dumallreq)
		}
		catch (e) {
			console.log(e)
		}
	}

	const loadData = async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		await fetchProfileData();
		await getPendingRequests_friends();
		if (isRefresh) setRefreshing(false);
	}

	useEffect(() => {
		loadData();
	}, [user]);

	const acceptfrndrequest = async (id) => {
		try {
			batch.delete(doc(db, 'users', user.uid, 'Connect_RequestsRecieved', id));
			batch.delete(doc(db, 'users', id, 'Connect_RequestsSent', user.uid));
			batch.update(doc(db, 'users', id), {
				requests: increment(-1),
				friends: increment(1),
				friendslist: arrayUnion(user.uid),
			})
			batch.update(doc(db, 'users', user.uid), {
				friends: increment(1),
				friendslist: arrayUnion(id),
			})

			await batch.commit();
		} catch (error) {
			console.log(error)
		}
	}

	const declinefrndrequest = async (id) => {
		try {
			batch.delete(doc(db, 'users', user.uid, 'Connect_RequestsRecieved', id));
			batch.delete(doc(db, 'users', id, 'Connect_RequestsSent', user.uid));
			batch.update(doc(db, 'users', id), {
				requests: increment(-1),
			})

			await batch.commit()
		}
		catch (error) {
			console.log(error);
		}
	}

	const renderRequestPending_friends = ({ item, index }) => {
		return (
			<View style={styles.requestCard}>
				<TouchableOpacity onPress={() => navi.navigate('OtherProfile', { uid: item?.toID })} style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
					<Image
						source={{ uri: item?.fromprofile }}
						style={{ width: 44, height: 44, borderRadius: 12 }} />
					<View style={{ flex: 1, marginLeft: 10 }}>
						<Text style={{ color: fontcolor, fontFamily: "Anaheim-Bold", fontSize: 14 }} numberOfLines={1}>{item?.fromusername}</Text>
						<Text style={{ color: mutedcolor, fontFamily: "Anaheim-Regular", fontSize: 12 }} numberOfLines={1}>{item?.fromname}</Text>
					</View>
				</TouchableOpacity>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<TouchableOpacity onPress={() => acceptfrndrequest(item?.toID)} style={[styles.iconCircle, { backgroundColor: '#22C55E22' }]}>
						<Entypo name="check" size={16} color="#22C55E" />
					</TouchableOpacity>
					<TouchableOpacity onPress={() => declinefrndrequest(item?.toID)} style={[styles.iconCircle, { backgroundColor: '#F0445222' }]}>
						<Entypo name="cross" size={18} color="#F04452" />
					</TouchableOpacity>
				</View>
			</View>
		)
	}


	const styles = StyleSheet.create({
		settingsView:
		{
			flexDirection: 'row',
			alignItems: 'center',
			width: '100%',
			paddingHorizontal: '4%',
			paddingTop: 0,
			paddingBottom: 10,
		},
		profileCard: {
			width: '92%',
			backgroundColor: cardBg,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: border,
			padding: '2%'
		},
		statBox: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 5,
		},
		statDivider: {
			width: 1,
			backgroundColor: border,
			marginVertical: 6,
		},
		editBtn: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: 10,
			borderRadius: 12,
			backgroundColor: accentSoft,
		},
		requestCard: {
			backgroundColor: cardBg,
			borderRadius: 16,
			borderWidth: 1,
			borderColor: border,
			flexDirection: 'row',
			alignItems: 'center',
			padding: 10,
			marginHorizontal: 16,
			marginBottom: 10,
		},
		iconCircle: {
			width: 34,
			height: 34,
			borderRadius: 17,
			alignItems: 'center',
			justifyContent: 'center',
		},
		sectionLabel: {
			fontFamily: 'Anaheim-Bold',
			fontSize: 15,
			color: fontcolor,
			marginHorizontal: 20,
			marginTop: 22,
			marginBottom: 10,
		}
	})
	return (
		<SafeAreaView style={{ backgroundColor: bg, flex: 1 }}>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			<ScrollView 
				contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={isDark ? '#F4F4F6' : '#17171B'} />
				}
			>
			{/* SETTINGS BAR */}
			<View style={styles.settingsView}>
				<View style={{ flex: 1 }}>
					<Text numberOfLines={1} style={TEXT.usernametxt}>{value?.username}{' '}
						{value?.isVerified && (
							<MaterialIcons name="verified" size={15} color={isDark ? '#06ec06' : '#00B341'} />
						)}</Text>
				</View>
				<TouchableOpacity onPress={() => navigation.navigate("Settings")} style={{ padding: 4 }}>
					<Ionicons name="settings-outline" size={22} color={fontcolor} />
				</TouchableOpacity>
			</View>

			{/* PROFILE CARD */}
			<Pressable onLongPress={() => setIsProfileVisible(true)} style={{ width: '100%', alignItems: 'center' }}>
				<View style={styles.profileCard}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Image
							source={{ uri: imageUri }}
							style={PROFILEPIC.ProfileScreenpic}
						/>
						<View style={{ flex: 1, marginLeft: 6 }}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }} numberOfLines={1}>{value?.fullname || 'Unknown'}</Text>
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
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.post}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Posts</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statBox}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.friends}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statBox}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 17 }}>{value?.requests}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Requests</Text>
						</View>
					</View>

					{/* ACTIONS */}
					<View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
						<TouchableOpacity onPress={() => navi.navigate('Edit')} style={styles.editBtn}>
							<Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>Edit Profile</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => setIsProfileVisible(true)} style={styles.editBtn}>
							<Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13 }}>Profile Card</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Pressable>

			{
				allreq_friends.length > 0 && (
					<Text style={styles.sectionLabel}>Friend Requests</Text>
				)
			}
			<FlatList
				data={allreq_friends}
				renderItem={renderRequestPending_friends}
				keyExtractor={(item, index) => `${item?.toID}-${index}`}
				style={{ width: '100%', marginTop: 4 }}
				scrollEnabled={false}
			/>
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
							style={{ height: 88, width: 88, borderRadius: 24, borderWidth: 3, borderColor: cardBg, marginTop: -52 }}
						/>
						<Text style={[TEXT.usernametxt, { fontSize: 19, textAlign: 'center', marginTop: 12, marginLeft: 0 }]}>{value?.fullname}</Text>
						<Text style={{ color: accent, fontFamily: 'Anaheim-SemiBold', fontSize: 14, textAlign:'center' }}>{"@" + value?.username}</Text>
						<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 13, textAlign: 'center', marginTop: 6 }}>{value?.bio}</Text>
					</View>
					<View style={{ marginTop: 18, flexDirection: 'row', backgroundColor: isDark ? '#232326' : '#F3F3F7', borderRadius: 14 }}>
						<View style={styles.statBox}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.post}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Posts</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statBox}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.friends}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Friends</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statBox}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }}>{value?.requests}</Text>
							<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 12 }}>Requests</Text>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

export default ProfileScreen