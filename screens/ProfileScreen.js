import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, ScrollView, FlatList, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import Modal from 'react-native-modal'
import { BlurView } from '@react-native-community/blur';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import auth from '../services/firebaseAuth'
import { db } from '../services/firebaseAuth'

import { useTheme } from '../utils/Theme'
import { useNavigation } from '@react-navigation/native';
import { Divider } from 'react-native-paper';

const ProfileScreen = () => {
	const navi = useNavigation();
	const { isDark, PROFILEPIC, TEXT, Colour } = useTheme();

	const batch = writeBatch(db);

	const [imageUri, setImageUri] = useState()
	const [value, setValue] = useState(null);
	const [famvalue, setfamValue] = useState(null);
	const [fullbio, setFullBio] = useState(false)
	const [allreq_friends, setAllReq_friends] = useState([]);
	const [allreq_family, setAllReq_family] = useState([]);
	const [famID, setFamId] = useState(null);
	const [otherID, setOtherId] = useState(null);

	const [leavegrpcon, setLeaveGrpCon] = useState(false);
	const [isprofilevisible, setIsProfileVisible] = useState(false);

	const [option, setOption] = useState('familyreq');

	const profilecard = isDark ? '#5c5c5cff' : '#b8b7b7'
	const fontcolor = isDark ? '#fff' : '#000';

	const navigation = useNavigation();

	const user = auth.currentUser;
	useEffect(() => {
		const fetchProfileData = async () => {
			const user = auth.currentUser;
			if (!user) {
				console.log("No User")
				return;
			}

			try {
				const userDocRef = doc(db, 'users', user.uid);

				const docSnap = await getDoc(userDocRef);
				const famID = docSnap.data().familyID;

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
				// const famdocSnap = await getDoc(doc(db, 'familyo', famID));
				// if(famdocSnap.exists()){
				// 	const famdata = famdocSnap.data();
				// 	setfamValue(famdata);
				// }
			}
			catch (e) {
				console.error("Error fetching profile: ", e);
			}
		};

		const getPendingRequests_friends = async () => {
			try {
				const userDocRef = doc(db, 'users', user.uid);
				const docSnap = await getDoc(userDocRef);
				// const famID = docSnap.data().familyID;

				let dumallreq = [];

				const frndsReqQuery = query(collection(db, 'users', user.uid, 'Connect_RequestsRecieved'), orderBy('time', 'asc'));
				const frndsReqSnap = await getDocs(frndsReqQuery);
				frndsReqSnap.docs.map((docs) => {
					dumallreq.push({
						fromname: docs.data().fromname,
						fromprofile: docs.data().fromprofile,
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

		const getPendingRequests_family = async () => {
			try {
				const userDocRef = doc(db, 'users', user.uid);
				const docSnap = await getDoc(userDocRef);
				const famID = docSnap.data().familyID;

				let dumallreq = [];

				const famReqSnapquery = query(collection(db, 'users', user.uid, 'RequestRecieved_to_join_fam'), orderBy('time', 'asc'));
				const famReqSnap = await getDocs(famReqSnapquery)
				famReqSnap.docs.map((docs) => {
					dumallreq.push({
						fromid: docs.data().from,
						fromname: docs.data().fromname,
						fromprofile: docs.data().fromprofile,
						status: docs.data().status,
						toname: docs.data().toname,
						toID: docs.data().to,
						famName: docs.data().famName,
						famID: docs.data().famID,
					})
				});
				setAllReq_family(dumallreq)
			}
			catch (e) {
				console.log(e);
			}
		}

		fetchProfileData();
		getPendingRequests_friends();
		getPendingRequests_family();
	}, [user, value]);

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

	const handleacceptfamrequest = async (id, oid) => {
		setLeaveGrpCon(true);
		setFamId(id);
		setOtherId(oid);
	}

	const acceptfamrequest = async () => {
		const getFamId = (await getDoc(doc(db, 'users', user.uid))).data().familyID;
		const target_ref = doc(db, 'users', user.uid);
		try {
			batch.delete(doc(db, 'users', user.uid, 'RequestRecieved_to_join_fam', otherID));
			batch.delete(doc(db, 'familyo', famID, 'Connect_RequestsSent_to_join_fam', user.uid));
			batch.delete(doc(db, 'familyo', getFamId, 'members', user.uid))
			batch.update(doc(db, 'familyo', famID), {
				familymem: increment(1),
				familyreq: increment(-1)
			});
			batch.update(doc(db, 'familyo', getFamId), {
				familymem: increment(-1),
			});
			batch.update(doc(db, 'users', user.uid), {
				familyID: famID
			});
			batch.set(doc(db, 'familyo', famID, 'members', user.uid), {
				referencedoc: target_ref
			}, { merge: true })
			batch.commit();

			const getoldfamlenght = (await getDoc(doc(db, 'familyo', getFamId))).data().familymem;
			console.log(getoldfamlenght);
			if (getoldfamlenght == 0) {
				await deleteDoc(doc(db, 'familyo', getFamId));
			}
		} catch (error) {
			console.log(error);
		}
		finally {
			setLeaveGrpCon(false)
		}
	}

	const declinefamrequest = async (oid) => {
		const getFamId = (await getDoc(doc(db, 'users', user.uid))).data().familyID;
		try {
			batch.delete(doc(db, 'users', user.uid, 'RequestRecieved_to_join_fam', oid));
			batch.delete(doc(db, 'familyo', getFamId, 'Connect_RequestsSent_to_join_fam', user.uid));
			batch.update(doc(db, 'familyo', getFamId), {
				familyreq: increment(-1),
			});

			await batch.commit()
		}
		catch (error) {
			console.log(error);
		}
	}

	const renderRequestPending_friends = ({ item, index }) => {
		return (
			<>
				<View style={{ backgroundColor: profilecard, borderRadius: 10, flexDirection: 'row', marginHorizontal: 10 }}>
					<TouchableOpacity onPress={() => navi.navigate('OtherProfile', { uid: item?.toID })} style={{ padding: 8, flexDirection: 'row', width: '80%' }}>
						<View>
							<Image
								source={{ uri: item?.fromprofile }}
								style={{ width: 45, height: 45, borderRadius: 8 }} />
						</View>
						<View style={{ flex: 1, left: 10, justifyContent: 'center' }}>
							<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: "Anaheim-Regular", }}>{item?.fromusername}</Text>
							<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: "Anaheim-Regular", }}>{item?.fromname}</Text>
						</View>
					</TouchableOpacity>
					<View style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 15, width: '20%' }}>
						<TouchableOpacity onPress={() => acceptfrndrequest(item?.toID)}>
							<Entypo name="check" size={18} color="#06ec06ff" />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => declinefrndrequest(item?.toID)}>
							<Entypo name="cross" size={22} color="#ff3333" />
						</TouchableOpacity>
					</View>
				</View>
			</>
		)
	}

	const renderRequestPending_family = ({ item, index }) => {
		// console.log(item)	
		return (
			<>
				<View style={{ backgroundColor: profilecard, marginTop: 15, borderRadius: 10, flexDirection: 'row', marginHorizontal: 10 }}>
					<View style={{ padding: 8, }}>
						<Image
							source={{ uri: item?.fromprofile }}
							style={{ height: 40, width: 40, borderRadius: 8 }} />
					</View>
					<View style={{ flex: 1, marginTop: '2%', }}>
						<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: "Anaheim-Regular", }}>{item?.fromname}</Text>
						<Text style={{ color: isDark ? '#fff' : '#000', fontFamily: "Anaheim-Regular", }}>{`Family Name: ${item?.famName}`}</Text>
					</View>
					<View style={{ justifyContent: 'center', marginHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
						<TouchableOpacity onPress={() => handleacceptfamrequest(item?.famID, item?.fromid)}>
							<Entypo name="check" size={18} color="#06ec06ff" />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => declinefamrequest(item?.fromid)}>
							<Entypo name="cross" size={22} color="#ff3333" />
						</TouchableOpacity>
					</View>
				</View>
			</>
		)
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
		<View style={{ backgroundColor: isDark ? "#252525" : "#f6f6f6", flex: 1, alignItems: 'center' }}>
			<StatusBar barStyle={'dark-content'} />
			<View style={styles.settingsView}>
				<View style={{ width: '85%' }}>
					<Text numberOfLines={1} style={TEXT.usernametxt}>{value?.username}{' '}
						{value?.isVerified && (
							<MaterialIcons name="verified" size={15} color={isDark ? "#06ec06ff" : '#00cc00ff'} />
						)}</Text>
				</View>
				<View style={{width:'15%', alignItems:'center', alignSelf:'center'}}>
					<TouchableOpacity onPress={() => navigation.navigate("Settings")}>
						<Ionicons name="settings" size={24} color={isDark ? '#fff' : '#000'} style={{ marginRight: '5%' }} />
					</TouchableOpacity>
				</View>
			</View>
			<Pressable onLongPress={() => setIsProfileVisible(true)} style={{ width: '96%', }}>
				<View style={{ justifyContent: 'center', alignItems: 'center', }}>
					<View style={{ flexDirection: 'row', backgroundColor: profilecard, width: '95%', borderTopRightRadius: 20, borderTopLeftRadius: 20, gap: 10, }}>
						<Image
							source={{ uri: imageUri }}
							style={PROFILEPIC.ProfileScreenpic}
						/>
						<View style={{ height: 75, width: '70%' }}>
							<Text style={{ color: fontcolor, marginTop: 10, fontFamily: 'Anaheim-Bold' }}>{value?.fullname || 'Unknown'}</Text>
							<Text style={TEXT.neonText}>{value?.neotext}</Text>
						</View>
					</View>
					<View style={{ backgroundColor: profilecard, flexDirection: 'row', width: '95%', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, minHeight: 70, justifyContent: 'space-between', marginTop: '0.3%' }}>
						<View style={[styles.postfrndreqcard, { borderBottomLeftRadius: 20, }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.post}</Text>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Posts</Text>
						</View>
						<View style={[styles.postfrndreqcard, { borderRadius: 20, width: 75 }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.friends}</Text>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', }} >Friends</Text>
						</View>
						<View style={[styles.postfrndreqcard, { marginRight: '2.5%', borderTopRightRadius: 0, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, width: 80 }]}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 17, alignSelf: 'center' }}>{value?.requests}</Text>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-SemiBold' }}>Requests</Text>
						</View>
					</View>
				</View>
				<View id='bio' style={{ marginLeft: '5%', marginTop: '5%' }}>
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
				<Divider style={{ width: '75%', alignSelf: 'center', marginVertical: 15 }} />
			</Pressable>
			<FlatList
				data={allreq_friends}
				renderItem={renderRequestPending_friends}
				style={{ width: '100%' }} />

			<Modal isVisible={leavegrpcon}
				onBackButtonPress={() => setLeaveGrpCon(false)}
				hasBackdrop
				backdropColor={isDark ? '#151515' : '#565656'}
				onBackdropPress={() => setLeaveGrpCon(false)}
				style={{ alignItems: 'center', justifyContent: 'center' }}>
				<View style={{ width: '90%', height: '16%', backgroundColor: isDark ? '#0e0e0e' : '#b6b6b6', alignItems: 'center', borderRadius: 8 }}>
					{/* HEADER */}
					<View style={{ marginVertical: 5 }}>
						<Text style={[TEXT.usernametxt, { fontSize: 20 }]}>Leave Group?</Text>
					</View>
					{/* BODY */}
					<View>
						<Text style={[TEXT.detailsSideHeading, { paddingHorizontal: 10 }]}>Accepting will cause you to leave the current group, invitation is required to join again.</Text>
					</View>
					{/* Footer */}
					<View style={{ marginVertical: 8, alignSelf: 'flex-end', marginRight: 15, flexDirection: 'row', gap: 10 }} >
						<TouchableOpacity onPress={() => setLeaveGrpCon(false)}>
							<Text style={{ color: '#06ec06ff', fontFamily: 'Anaheim-SemiBold', fontSize: 15 }}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={acceptfamrequest}>
							<Text style={{ color: '#ff3333', fontFamily: 'Anaheim-SemiBold', fontSize: 15 }}>Confirm</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

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
				<View style={{ width: '90%', height: 'auto', backgroundColor: isDark ? '#000000' : '#b6b6b6', borderRadius: 13, padding: 15 }}>
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
			</Modal>
		</View>
	)
}

export default ProfileScreen