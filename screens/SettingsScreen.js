import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native'
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal'
import { BlurView } from '@react-native-community/blur';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Snackbar } from 'react-native-paper';

import { signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import auth, { db } from '../services/firebaseAuth';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';

const SettingsScreen = () => {
	const navi = useNavigation();

	const { isDark, TEXT, TEXTINPUT } = useTheme();

	// Same derived palette used by ProfileScreen, so both screens read as one product
	const bg = isDark ? '#121214' : '#F7F7FA';
	const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
	const border = isDark ? '#2E2E33' : '#E7E7ED';
	const fontcolor = isDark ? '#F4F4F6' : '#17171B';
	const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
	const accent = isDark ? '#06ec06' : '#00B341';
	const accentSoft = isDark ? '#173620' : '#E6F9EC';
	const danger = '#F04452';
	const dangerSoft = '#F0445222';

	const user = auth.currentUser;

	const [Email, setEmail] = useState('')
	const [currpasswd, setCurrPasswd] = useState('')
	const [showpasswd, setShowPasswd] = useState(false)
	const [isdeletemodalvisible, setIsDeleteModalVisible] = useState(false)
	const [accountinfo, setAccountInfo] = useState(false);

	const [invalid, setInValidSnackVisible] = useState(false);

	const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff';

	const handleSignout = async () => {
		try {
			const docRef = doc(db, 'users', user.uid);
			await updateDoc(docRef, {
				otpVerified: false,
				nextOTPTime: 0,
				otp: null,
			});
			await auth.signOut();
			navi.replace('Login');
		}
		catch (e) {
			console.log(e);
		}
	}

	const deleteAccount = async () => {
		if (!user) {
			navi.replace('Login')
			return;
		}

		try {
			const Crendential = EmailAuthProvider.credential(Email, currpasswd);
			await reauthenticateWithCredential(user, Crendential);

			const docRef = collection(db, 'posts');
			const docSnap = await getDocs(docRef);

			docSnap.docs.map((item) => {
				if (item.data().userID === user.uid) {
					deleteDoc(doc(db, 'posts', item.data().postID))
				}
			})

			await deleteDoc(doc(db, 'users', user.uid));
			await user.delete();

			navi.replace('Login');
		}
		catch (e) {
			setInValidSnackVisible(true)
		}
	}

	const styles = StyleSheet.create({
		container: {
			backgroundColor: bg,
			flex: 1,
		},
		header: {
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: '4%',
			paddingBottom: 10,
			gap: 15,
		},
		sectionLabel: {
			fontFamily: 'Anaheim-Bold',
			fontSize: 15,
			color: fontcolor,
			marginHorizontal: 4,
			marginBottom: 10,
		},
		card: {
			backgroundColor: cardBg,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: border,
			marginBottom: 24,
			overflow: 'hidden',
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 12,
			paddingHorizontal: 14,
			gap: 12,
		},
		rowDivider: {
			height: 1,
			backgroundColor: border,
			marginLeft: 58,
		},
		iconCircle: {
			width: 34,
			height: 34,
			borderRadius: 17,
			alignItems: 'center',
			justifyContent: 'center',
		},
		rowText: {
			flex: 1,
			fontFamily: 'Anaheim-SemiBold',
			fontSize: 15,
			color: fontcolor,
		},
	})

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navi.goBack()}>
					<Feather name="arrow-left" size={24} color={fontcolor} />
				</TouchableOpacity>
				<Text style={TEXT.heading}>Settings</Text>
			</View>

			<ScrollView style={{ width: '92%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
				{/* SECURITY */}
				<Text style={styles.sectionLabel}>Security</Text>
				<View style={styles.card}>
					{/* SECURITY INFO */}
					<TouchableOpacity onPress={() => navi.navigate('Securityinfo')} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<Ionicons name="key-outline" size={18} color={accent} />
						</View>
						<Text style={styles.rowText}>Change security info</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
					<View style={styles.rowDivider} />

					{/* 2 FACTOR AUTHENTICATION */}
					<TouchableOpacity onPress={() => navi.navigate('TwoFact')} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<MaterialCommunityIcons name="two-factor-authentication" size={18} color={accent} />
						</View>
						<Text style={styles.rowText}>2 factor authentication</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
					<View style={styles.rowDivider} />

					{/* VERIFICATION BADGE */}
					<TouchableOpacity style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<MaterialIcons name="verified" size={18} color={accent} />
						</View>
						<Text style={styles.rowText}>Get verification badge</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
				</View>

				{/* Help & Support */}
				<Text style={styles.sectionLabel}>Support</Text>
				<View style={styles.card}>
					{/* Privacy Policy */}
					<TouchableOpacity onPress={() => navi.navigate('Privacy')} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<MaterialCommunityIcons name="shield-check-outline" size={18} color={accent} />
						</View>
						<Text style={[styles.rowText, { color: fontcolor }]}>Privacy Policy</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
					<View style={styles.rowDivider} />
					{/* Help */}
					<TouchableOpacity onPress={() => navi.navigate('Help')} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft}]}>
							<Feather name="help-circle" size={18} color={accent} />
						</View>
						<Text style={styles.rowText}>Help & Supppot</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
				</View>

				{/* ACCOUNT */}
				<Text style={styles.sectionLabel}>Account</Text>
				<View style={styles.card}>
					{/* SIGNOUT */}
					<TouchableOpacity onPress={handleSignout} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: isDark?'#ffaa0027' : '#ff880027'  }]}>
							<Ionicons name="log-out-outline" size={18} color={isDark? '#ffaa00': '#ff8800'} />
						</View>
						<Text style={[styles.rowText, { color: isDark? '#ffaa00': '#ff8800' }]}>Signout</Text>
					</TouchableOpacity>
					<View style={styles.rowDivider} />

					{/* DELETE */}
					<TouchableOpacity onPress={() => setIsDeleteModalVisible(true)} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: dangerSoft }]}>
							<Feather name="trash-2" size={16} color={danger} />
						</View>
						<Text style={[styles.rowText, { color: danger }]}>Delete account</Text>
					</TouchableOpacity>
				</View>

				<Text style={styles.sectionLabel}>Review</Text>
				<View style={[styles.card, {paddingVertical: 15, paddingLeft: 15}]}>
					<TouchableOpacity onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.develax.connect')} style={{flexDirection: 'row', gap: 12}}>
						<Feather name="star" size={40} color={accent} />
						<View style={{justifyContent:'center'}}>
							<Text style={styles.rowText}>Love this App?</Text>
							<Text style={[styles.rowText, {fontSize: 12, color: 'grey'}]}>Rate it on Play Store</Text>
						</View>
					</TouchableOpacity>
					<View style={[styles.rowDivider, {marginVertical: 15}]} />

					{/* Other Apps */}
					<TouchableOpacity onPress={() => Linking.openURL('https://play.google.com/store/apps/developer?id=Develax')} style={{flexDirection: 'row', gap: 12,}}>
						{/* <Feather name="star" size={40} color={accent} /> */}
						<MaterialCommunityIcons name="apps" size={40} color={accent} />
						<View style={{justifyContent:'center'}}>
							<Text style={styles.rowText}>Other Appss</Text>
							<Text style={[styles.rowText, {fontSize: 12, color: 'grey'}]}>Check other apps developed by Team Develax</Text>
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* DELETE ACCOUNT */}
			<Modal
				isVisible={isdeletemodalvisible}
				animationIn={'rubberBand'}
				hasBackdrop
				backdropOpacity={1}
				customBackdrop={
					<BlurView
						style={{ flex: 1 }}
						blurType={isDark ? 'dark' : 'light'}
						blurAmount={5}
						reducedTransparencyFallbackColor="white"
					/>
				}
				onBackButtonPress={() => setIsDeleteModalVisible(false)}
				onBackdropPress={() => setIsDeleteModalVisible(false)}
				style={{ justifyContent: 'center' }} >
				<View style={{ width: '88%', alignSelf: 'center', backgroundColor: cardBg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
					<View style={[styles.iconCircle, { width: 48, height: 48, borderRadius: 24, backgroundColor: dangerSoft, marginBottom: 10 }]}>
						<Feather name="trash-2" size={20} color={danger} />
					</View>
					<Text style={[TEXT.subheading, { alignSelf: 'center', marginBottom: 4, marginLeft: 0 }]}>Delete Account</Text>
					<Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
						This can't be undone. Confirm your credentials to continue.
					</Text>

					<TextInput
						placeholder='Email'
						placeholderTextColor={placeholdercolor}
						style={[TEXTINPUT.txtinput, { width: '100%', minWidth: 0 }]}
						keyboardType='email-address'
						autoCapitalize='none'
						value={Email}
						onChangeText={setEmail} />

					<View style={{
						backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
						borderRadius: 12,
						borderWidth: 1,
						borderColor: border,
						marginVertical: 6,
						width: '100%',
						minHeight: 46,
						alignItems: 'center',
						justifyContent: 'space-between',
						flexDirection: 'row',
						paddingHorizontal: 14,
					}}>
						<TextInput
							style={{ color: fontcolor, flex: 1, fontFamily: 'Anaheim-SemiBold' }}
							placeholder='Password'
							value={currpasswd}
							onChangeText={setCurrPasswd}
							secureTextEntry={!showpasswd}
							placeholderTextColor={placeholdercolor} />
						<TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
							{
								showpasswd ?
									<Entypo name="eye" size={20} color={placeholdercolor} />
									:
									<Entypo name="eye-with-line" size={20} color={placeholdercolor} />
							}
						</TouchableOpacity>
					</View>

					<View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 12 }}>
						<TouchableOpacity
							onPress={() => setIsDeleteModalVisible(false)}
							style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: isDark ? '#232326' : '#F3F3F7' }}>
							<Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 14, }}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={deleteAccount}
							style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: danger }}>
							<Text style={{ color: '#fff', fontFamily: 'Anaheim-Bold', fontSize: 14, textAlign: 'center', }}>Confirm Delete</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* INVALID CREDENTIALS SNACK */}
				<Snackbar
					visible={invalid}
					onDismiss={() => setInValidSnackVisible(false)}
					onclick={() => setInValidSnackVisible(false)}
					duration={3000}
					wrapperStyle={{ position: 'absolute' }}
					style={{ height: 'auto' }}
					sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
					Invalid credentials!
				</Snackbar>

			</Modal>
		</SafeAreaView>
	)
}

export default SettingsScreen;