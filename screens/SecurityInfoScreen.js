import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';
import { BlurView } from '@react-native-community/blur';

import { useTheme } from '../utils/Theme'
import Feather from 'react-native-vector-icons/Feather'
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { updateDoc, doc, getDoc } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import { verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

const SecurityInfoScreen = () => {

	const { isDark, TEXT } = useTheme();
	const navi = useNavigation();
	const user = auth.currentUser;
	const isGoogleUser = user?.providerData?.some(provider => provider.providerId === 'google.com');

	// Same derived palette used across ProfileScreen / SettingsScreen, so every screen reads as one product
	const bg = isDark ? '#121214' : '#F7F7FA';
	const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
	const border = isDark ? '#2E2E33' : '#E7E7ED';
	const fontcolor = isDark ? '#F4F4F6' : '#17171B';
	const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
	const accent = isDark ? '#06ec06' : '#00B341';
	const accentSoft = isDark ? '#173620' : '#E6F9EC';
	const inputBg = isDark ? '#2A2A2F' : '#EFEFF4';
	const danger = '#F04452';

	const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff';

	const [changeemailmodalvisible, setChangeEmailModalVisible] = useState(false);

	// CHANGE EMAIL
	const [newEmail, setNewEmail] = useState('');
	const [currpasswd, setCurrPasswd] = useState('');
	const [showpasswd, setShowPasswd] = useState(false)
	const [emailsnackvisible, setEmailSnackVisible] = useState(false);
	const [wrongemailsnackvisible, setWrongEmailSnackVisible] = useState(false);

	// CHANGE PASSWORD
	const [changepasswordmodalvisible, setChangePasswordModalVisible] = useState(false);
	const [newpasswd, setNewPasswd] = useState('');
	const [repasswd, setRePasswd] = useState('');
	const [passwdsnackvisible, setPasswdSnackVisible] = useState(false);
	const [wrongrepasswdsnackvisible, setWrongRePasswdSnackVisible] = useState(false);
	const [wrongpasswdsnackvisible, setWrongPasswdSnackVisible] = useState(false);
	const [shownewpasswd, setShowNewPasswd] = useState(false)
	const [showrenewpasswd, setShowReNewPasswd] = useState(false)

	// Change Phone Number
	const [changephonenumber, setChangePhoneNumber] = useState(false);
	const [phonenumber, setPhoneNumber] = useState('');
	const [newphonenumber, setNewPhoneNumber] = useState('');
	const [wrongphonenosnackvisible, setWrongPhoneNoSnackVisible] = useState(false);
	const [phonenumberchangedsnackvisible, setPhoneNumberChangedSnackVisible] = useState(false);

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: bg,
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
		sheet: {
			backgroundColor: cardBg,
			padding: 20,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: border,
			alignItems: 'center',
		},
		sheetTitle: {
			alignSelf: 'center',
			marginBottom: 4,
			marginLeft: 0,
		},
		sheetSubtitle: {
			color: mutedcolor,
			fontFamily: 'Anaheim-Regular',
			fontSize: 13,
			textAlign: 'center',
			marginBottom: 14,
		},
		input: {
			backgroundColor: inputBg,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: border,
			paddingHorizontal: 14,
			marginVertical: 6,
			minHeight: 46,
			width: '100%',
			color: fontcolor,
			fontFamily: 'Anaheim-SemiBold',
		},
		passwordWrap: {
			backgroundColor: inputBg,
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
		},
		passwordInput: {
			color: fontcolor,
			flex: 1,
			fontFamily: 'Anaheim-SemiBold',
		},
		confirmBtn: {
			width: '100%',
			alignItems: 'center',
			paddingVertical: 12,
			borderRadius: 12,
			backgroundColor: accent,
			marginTop: 10,
		},
		confirmBtnText: {
			color: '#000',
			fontFamily: 'Anaheim-Bold',
			fontSize: 14,
		},
	});

	const changeEmailFunc = async () => {
		try {
			const Credentials = EmailAuthProvider.credential(user.email, currpasswd);
			await reauthenticateWithCredential(user, Credentials);
			await verifyBeforeUpdateEmail(user, newEmail);
			setEmailSnackVisible(true);
		}
		catch (e) {
			console.log("Error changing email: ", e);
			setWrongEmailSnackVisible(true);
			return;
		}

		setCurrPasswd('');
		setNewEmail('');
		setChangeEmailModalVisible(false);
		setShowPasswd(false);
	}

	const changePasswdFunc = async () => {
		if (newpasswd !== repasswd) {
			setWrongRePasswdSnackVisible(true);
			return;
		}
		if (repasswd === '' || newpasswd === '' || currpasswd === '') {
			setWrongPasswdSnackVisible(true);
			return;
		}

		try {
			const Crendential = EmailAuthProvider.credential(user.email, currpasswd);
			await reauthenticateWithCredential(user, Crendential);
			await updatePassword(user, newpasswd);
			setPasswdSnackVisible(true);
		}
		catch (e) {
			console.log("Error changing password: ", e);
			setWrongPasswdSnackVisible(true);
			return;
		}

		setCurrPasswd('');
		setNewPasswd('');
		setRePasswd('');
		setChangePasswordModalVisible(false);
	}

	const changePhoneNumberFunc = async () => {
		const docRef = doc(db, 'users', user.uid);
		const docSnap = await getDoc(docRef);

		if ((phonenumber === '' && docSnap.data().phone_number !== '') || newphonenumber === '') {
			setWrongPhoneNoSnackVisible(true);
			return;
		}
		try {
			if (docSnap.exists() && docSnap.data().phone_number !== phonenumber) {
				setWrongPhoneNoSnackVisible(true);
				return;
			}
			await updateDoc(doc(db, 'users', user.uid), {
				phone_number: newphonenumber
			});
			setPhoneNumberChangedSnackVisible(true);
			setChangePhoneNumber(false);
			setPhoneNumber('');
			setNewPhoneNumber('');
		}
		catch (e) {
			console.log("Error changing phone number: ", e);
			setWrongPhoneNoSnackVisible(true);
			return;
		}
	}

	// Small reusable password field so every modal below matches
	const PasswordField = ({ placeholder, value, onChangeText, show, onToggleShow }) => (
		<View style={styles.passwordWrap}>
			<TextInput
				style={styles.passwordInput}
				placeholder={placeholder}
				value={value}
				onChangeText={onChangeText}
				secureTextEntry={!show}
				placeholderTextColor={placeholdercolor} />
			<TouchableOpacity onPress={onToggleShow}>
				{
					show ?
						<Entypo name="eye" size={20} color={placeholdercolor} />
						:
						<Entypo name="eye-with-line" size={20} color={placeholdercolor} />
				}
			</TouchableOpacity>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navi.goBack()}>
					<Feather name="arrow-left" size={24} color={fontcolor} />
				</TouchableOpacity>
				<Text style={TEXT.heading}>Security Info</Text>
			</View>

			<View style={{ width: '92%', alignSelf: 'center' }}>
				{/* SECURITY */}
				<Text style={styles.sectionLabel}>Security</Text>
				<View style={styles.card}>
					{!isGoogleUser ? (
						<>
							{/* CHANGE EMAIL */}
							<TouchableOpacity onPress={() => setChangeEmailModalVisible(true)} style={styles.row}>
								<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
									<Ionicons name="mail-outline" size={18} color={accent} />
								</View>
								<Text style={styles.rowText}>Change email</Text>
								<Feather name="chevron-right" size={18} color={mutedcolor} />
							</TouchableOpacity>
							<View style={styles.rowDivider} />

							{/* CHANGE PASSWORD */}
							<TouchableOpacity onPress={() => setChangePasswordModalVisible(true)} style={styles.row}>
								<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
									<Ionicons name="lock-closed-outline" size={18} color={accent} />
								</View>
								<Text style={styles.rowText}>Change password</Text>
								<Feather name="chevron-right" size={18} color={mutedcolor} />
							</TouchableOpacity>
							<View style={styles.rowDivider} />
						</>
					) : (
						<View style={[styles.row, {paddingBottom: 4, paddingHorizontal: 14}]}>
							<Text style={{color: mutedcolor, fontSize: 13, fontFamily: 'Anaheim-Regular'}}>Your email and password are managed securely by Google.</Text>
						</View>
					)}

					{/* CHANGE PHONE NUMBER */}
					<TouchableOpacity onPress={() => setChangePhoneNumber(true)} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<MaterialCommunityIcons name="phone-outline" size={18} color={accent} />
						</View>
						<Text style={styles.rowText}>Change phone number</Text>
						<Feather name="chevron-right" size={18} color={mutedcolor} />
					</TouchableOpacity>
				</View>
			</View>

			{/* CHANGE EMAIL MODAL */}
			<Modal isVisible={changeemailmodalvisible}
				hasBackdrop={true}
				backdropOpacity={1}
				customBackdrop={
					<BlurView style={{ flex: 1 }} blurType={isDark ? 'dark' : 'light'} blurAmount={5} reducedTransparencyFallbackColor="white" />
				}
				onBackdropPress={() => { setChangeEmailModalVisible(false); setCurrPasswd(''); }}
				onBackButtonPress={() => { setChangeEmailModalVisible(false); setCurrPasswd(''); }}
				animationIn={'rubberBand'}
				style={{ justifyContent: 'center' }} >

				<View style={[styles.sheet, { width: '88%', alignSelf: 'center' }]}>
					<View style={[styles.iconCircle, { width: 48, height: 48, borderRadius: 24, backgroundColor: accentSoft, marginBottom: 10 }]}>
						<Ionicons name="mail-outline" size={20} color={accent} />
					</View>
					<Text style={[TEXT.subheading, styles.sheetTitle]}>Change Email</Text>
					<Text style={styles.sheetSubtitle}>We'll send a verification link to the new address.</Text>

					<TextInput
						placeholder='New email'
						placeholderTextColor={placeholdercolor}
						style={styles.input}
						keyboardType='email-address'
						autoCapitalize='none'
						value={newEmail}
						onChangeText={setNewEmail} />

					<PasswordField
						placeholder='Current password'
						value={currpasswd}
						onChangeText={setCurrPasswd}
						show={showpasswd}
						onToggleShow={() => setShowPasswd(!showpasswd)} />

					<TouchableOpacity style={styles.confirmBtn} onPress={changeEmailFunc}>
						<Text style={styles.confirmBtnText}>Change</Text>
					</TouchableOpacity>
				</View>

				{/* WRONG EMAIL SNACK */}
				<Snackbar
					visible={wrongemailsnackvisible}
					onDismiss={() => setWrongEmailSnackVisible(false)}
					onclick={() => setWrongEmailSnackVisible(false)}
					duration={3000}
					wrapperStyle={{ position: 'absolute' }}
					sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
					Invalid email or password!
				</Snackbar>
			</Modal>

			{/* CHANGE PASSWORD MODAL */}
			<Modal isVisible={changepasswordmodalvisible}
				hasBackdrop={true}
				backdropOpacity={1}
				customBackdrop={
					<BlurView style={{ flex: 1 }} blurType={isDark ? 'dark' : 'light'} blurAmount={5} reducedTransparencyFallbackColor="white" />
				}
				onBackdropPress={() => { setChangePasswordModalVisible(false); setCurrPasswd(''); setNewPasswd(''); setRePasswd(''); }}
				onBackButtonPress={() => { setChangePasswordModalVisible(false); setCurrPasswd(''); setNewPasswd(''); setRePasswd(''); }}
				animationIn={'rubberBand'}
				style={{ justifyContent: 'center' }} >

				<View style={[styles.sheet, { width: '88%', alignSelf: 'center' }]}>
					<View style={[styles.iconCircle, { width: 48, height: 48, borderRadius: 24, backgroundColor: accentSoft, marginBottom: 10 }]}>
						<Ionicons name="lock-closed-outline" size={20} color={accent} />
					</View>
					<Text style={[TEXT.subheading, styles.sheetTitle]}>Change Password</Text>
					<Text style={styles.sheetSubtitle}>Enter your current password to confirm it's you.</Text>

					<PasswordField
						placeholder='Current password'
						value={currpasswd}
						onChangeText={setCurrPasswd}
						show={showpasswd}
						onToggleShow={() => setShowPasswd(!showpasswd)} />

					<PasswordField
						placeholder='New password'
						value={newpasswd}
						onChangeText={setNewPasswd}
						show={shownewpasswd}
						onToggleShow={() => setShowNewPasswd(!shownewpasswd)} />

					<PasswordField
						placeholder='Re-enter new password'
						value={repasswd}
						onChangeText={setRePasswd}
						show={showrenewpasswd}
						onToggleShow={() => setShowReNewPasswd(!showrenewpasswd)} />

					<TouchableOpacity style={styles.confirmBtn} onPress={changePasswdFunc}>
						<Text style={styles.confirmBtnText}>Change</Text>
					</TouchableOpacity>
				</View>

				{/* WRONG RePasswd SNACK */}
				<Snackbar
					visible={wrongrepasswdsnackvisible}
					onDismiss={() => setWrongRePasswdSnackVisible(false)}
					onclick={() => setWrongRePasswdSnackVisible(false)}
					duration={3000}
					wrapperStyle={{ position: 'absolute' }}
					sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
					New passwords do not match!
				</Snackbar>

				{/* WRONG PASSWORD SNACK */}
				<Snackbar
					visible={wrongpasswdsnackvisible}
					onDismiss={() => setWrongPasswdSnackVisible(false)}
					onclick={() => setWrongPasswdSnackVisible(false)}
					duration={3000}
					wrapperStyle={{ position: 'absolute' }}
					sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
					Invalid password!
				</Snackbar>
			</Modal>

			{/* CHANGE PHONE NUMBER MODAL */}
			<Modal isVisible={changephonenumber}
				hasBackdrop={true}
				backdropOpacity={1}
				customBackdrop={
					<BlurView style={{ flex: 1 }} blurType={isDark ? 'dark' : 'light'} blurAmount={5} reducedTransparencyFallbackColor="white" />
				}
				onBackdropPress={() => { setChangePhoneNumber(false); }}
				onBackButtonPress={() => { setChangePhoneNumber(false); }}
				animationIn={'rubberBand'}
				style={{ justifyContent: 'center' }} >

				<View style={[styles.sheet, { width: '88%', alignSelf: 'center' }]}>
					<View style={[styles.iconCircle, { width: 48, height: 48, borderRadius: 24, backgroundColor: accentSoft, marginBottom: 10 }]}>
						<MaterialCommunityIcons name="phone-outline" size={20} color={accent} />
					</View>
					<Text style={[TEXT.subheading, styles.sheetTitle]}>Change Phone Number</Text>
					<Text style={styles.sheetSubtitle}>Confirm your current number, then set the new one.</Text>

					<TextInput
						placeholder='Current phone number'
						placeholderTextColor={placeholdercolor}
						style={styles.input}
						keyboardType='phone-pad'
						value={phonenumber}
						onChangeText={setPhoneNumber} />

					<TextInput
						placeholder='New phone number'
						placeholderTextColor={placeholdercolor}
						style={styles.input}
						keyboardType='phone-pad'
						value={newphonenumber}
						onChangeText={setNewPhoneNumber} />

					<TouchableOpacity style={styles.confirmBtn} onPress={changePhoneNumberFunc}>
						<Text style={styles.confirmBtnText}>Change</Text>
					</TouchableOpacity>
				</View>

				{/* WRONG PHONE NUMBER SNACK */}
				<Snackbar
					visible={wrongphonenosnackvisible}
					onDismiss={() => setWrongPhoneNoSnackVisible(false)}
					onclick={() => setWrongPhoneNoSnackVisible(false)}
					duration={3000}
					wrapperStyle={{ position: 'absolute' }}
					sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
					Wrong phone number!
				</Snackbar>
			</Modal>

			{/* CHANGED EMAIL SNACK */}
			<Snackbar
				visible={emailsnackvisible}
				onDismiss={() => setEmailSnackVisible(false)}
				onclick={() => setEmailSnackVisible(false)}
				duration={3000}
				wrapperStyle={{ position: 'absolute' }}
				sidebg={{ backgroundColor: accent }}>
				Email changed successfully!
			</Snackbar>

			{/* CHANGED PASSWD SNACK */}
			<Snackbar
				visible={passwdsnackvisible}
				onDismiss={() => setPasswdSnackVisible(false)}
				onclick={() => setPasswdSnackVisible(false)}
				duration={3000}
				wrapperStyle={{ position: 'absolute' }}
				sidebg={{ backgroundColor: accent }}>
				Password changed successfully!
			</Snackbar>

			{/* CHANGED PHONE NUMBER SNACK */}
			<Snackbar
				visible={phonenumberchangedsnackvisible}
				onDismiss={() => setPhoneNumberChangedSnackVisible(false)}
				onclick={() => setPhoneNumberChangedSnackVisible(false)}
				duration={3000}
				wrapperStyle={{ position: 'absolute' }}
				sidebg={{ backgroundColor: accent }}>
				Phone number changed successfully!
			</Snackbar>

		</SafeAreaView>
	)
}

export default SecurityInfoScreen