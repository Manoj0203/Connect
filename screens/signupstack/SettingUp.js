import {
	Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, StyleSheet,
	Image, TouchableOpacity, Alert, View, StatusBar, ActivityIndicator, Modal
} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../utils/Theme'
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import { Snackbar } from 'react-native-paper';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import auth, { db } from '../../services/firebaseAuth'
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const SettingUp = () => {

	const { Colour, isDark, TEXTINPUT, PROFILEPIC, BUTTON, TEXT, RADIUS } = useTheme()
	const [fullname, setFullName] = useState('')
	const [bio, setBio] = useState('')
	const [dob, setDOB] = useState('Date of Birth');
	const defaultImageUri = Image.resolveAssetSource(require('../../assets/images/user.png')).uri;
	const defaultImageUriobj = defaultImageUri

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [imageUri, setImageUri] = useState(defaultImageUriobj);
	const [pro_pic, setPro_pic] = useState(false);
	const [tempDate, setTempDate] = useState(null);

	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	// Snackbar
	const [fullnameexistsnakcvisible, setFullNameExistSnackVisible] = useState(false);
	const [enterallfieldssnackvisible, setEnterAllFieldsSnackVisible] = useState(false);
	const [dobexistsnakcvisible, setDOBExistSnackVisible] = useState(false);

	// Calendar
	const defaultPickerStyles = useDefaultStyles(isDark ? 'dark' : 'light');
	const accentColor = isDark ? '#4fe24ac4' : '#06b100c4';
	const accentSoft = isDark ? '#173620' : '#E6F9EC';
	const border = isDark ? '#2E2E33' : '#E7E7ED';
	const fontcolor = isDark ? '#F4F4F6' : '#17171B';
	const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
	const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';

	// Allowed range: from Jan 1, 1930 up to (today - 18 years).
	const minDate = new Date(1930, 0, 1);
	const maxDate = new Date();
	maxDate.setFullYear(maxDate.getFullYear() - 18);

	const openDatePicker = () => {
		setTempDate(null);
		setShowDatePicker(true);
	};
	const onCancel = () => setShowDatePicker(false);

	const formatDate = (date) => {
		const d = String(date.getDate()).padStart(2, '0');
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const y = date.getFullYear();
		return `${d}-${m}-${y}`;
	};

	const onConfirm = () => {
		if (tempDate) {
			setDOB(formatDate(tempDate));
		}
		setShowDatePicker(false);
	};

	const pickAndCropImage = async () => {
		try {
			const image = await ImagePicker.openPicker({
				width: 300,
				height: 300,
				cropperToolbarTitle: 'Profile Picture',
				mediaType: 'photo',
				compressImageQuality: 0.6,
				compressImageMaxHeight: 1200,
				compressImageMaxWidth: 1200,
				cropping: true,
				cropperCircleOverlay: false,
				freeStyleCropEnabled: true,
				mediaType: 'photo',
				multiple: false,
			});

			setPro_pic(true);
			setImageUri(image);

		} catch (error) {
			if (error.code !== 'E_PICKER_CANCELLED') {
				console.log('ImagePicker Error: ', error);
				Alert.alert('Error', 'Failed to pick or crop image.');
			}
		}
	};

	const handleProfileUpdate = async () => {

		if (!fullname.trim()) {
			setFullNameExistSnackVisible(true);
			return;
		}
		if (dob === 'Date of Birth') {
			setDOBExistSnackVisible(true)
			return;
		}
		if (!fullname.trim() || !dob.trim()) {
			setEnterAllFieldsSnackVisible(true);
			return;
		}

		const user = auth.currentUser;

		if (!user) {
			return;
		}

		setLoading(true);



		try {
			let data = null;

			if (pro_pic) {
				console.log(imageUri)
				const formData = new FormData();
				formData.append('file', {
					uri: imageUri.path,
					type: imageUri.mime,
					name: imageUri.filename || null,
				});

				formData.append('upload_preset', 'profilepics');

				const res = await fetch(
					'https://api.cloudinary.com/v1_1/dwlh6mtl2/image/upload',
					{
						method: 'POST',
						body: formData,
					}
				);

				data = await res.json();
			}

			const userData = {
				fullname: fullname.trim(),
				bio: bio.trim(),
				dob: dob,
				image: data?.secure_url ?? imageUri,
				isSetupComplete: true,
			};
			const userDocRef = doc(db, 'users', user.uid);

			await updateDoc(userDocRef, userData);

			navigation.replace('Tabs')

		} catch (e) {
			console.error("Error updating profile: ", e);
		} finally {
			setLoading(false);
		}
	};

	const placeholdercolor = isDark ? '#b5b5b5dc' : '#7e7e7eff'

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		formContainer: {
			flexGrow: 1,
			justifyContent: 'center',
			alignItems: 'center',
			width: '85%',
			paddingVertical: 24,
		},
		headerText: {
			marginBottom: 4,
		},
		subtitle: {
			color: mutedcolor,
			fontFamily: 'Anaheim-Regular',
			fontSize: 14,
			marginBottom: 26,
			textAlign: 'center',
		},
		avatarWrap: {
			marginBottom: 26,
			alignItems: 'center',
		},
		avatarImage: {
			width: 96,
			height: 96,
			borderRadius: 26,
			borderWidth: 2,
			borderColor: border,
		},
		avatarEditBadge: {
			position: 'absolute',
			bottom: -4,
			right: -4,
			width: 30,
			height: 30,
			borderRadius: 15,
			backgroundColor: accentColor,
			alignItems: 'center',
			justifyContent: 'center',
			borderWidth: 2,
			borderColor: cardBg,
		},
		avatarHint: {
			color: mutedcolor,
			fontFamily: 'Anaheim-SemiBold',
			fontSize: 12.5,
			marginTop: 10,
		},
		inputWrap: {
			width: '100%',
			marginBottom: 14,
		},
		inputLabel: {
			color: mutedcolor,
			fontFamily: 'Anaheim-SemiBold',
			fontSize: 12.5,
			marginBottom: 6,
			marginLeft: 4,
		},
		inputRow: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
			borderRadius: RADIUS?.md ?? 12,
			borderWidth: 1,
			borderColor: border,
			paddingHorizontal: 14,
			minHeight: 50,
			width: '100%',
		},
		inputIcon: {
			marginRight: 10,
		},
		nameInput: {
			flex: 1,
			color: fontcolor,
			fontFamily: 'Anaheim-SemiBold',
			fontSize: 15,
			paddingVertical: 12,
		},
		bioRow: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
			borderRadius: RADIUS?.md ?? 12,
			borderWidth: 1,
			borderColor: border,
			paddingHorizontal: 14,
			width: '100%',
		},
		bioInput: {
			flex: 1,
			minHeight: 75,
			maxHeight: 150,
			color: fontcolor,
			fontFamily: "Anaheim-SemiBold",
			fontSize: 15,
		},
		lengthText: {
			color: mutedcolor,
			alignSelf: 'flex-end',
			marginTop: 4,
			marginBottom: 4,
			fontFamily: "Anaheim-SemiBold",
			fontSize: 12,
		},
		completeBtn: {
			width: '100%',
			backgroundColor: accentColor,
			borderRadius: RADIUS?.md ?? 12,
			paddingVertical: 14,
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: 12,
			shadowColor: accentColor,
			shadowOpacity: 0.25,
			shadowRadius: 10,
			shadowOffset: { width: 0, height: 4 },
			elevation: 3,
		},
		completeBtnText: {
			color: '#fff',
			fontFamily: 'Anaheim-Bold',
			fontSize: 16,
		},
		datePickerOverlay: {
			flex: 1,
			justifyContent: 'flex-end',
			backgroundColor: 'rgba(0,0,0,0.4)',
		},
		datePickerSheet: {
			backgroundColor: isDark ? '#1C1C1F' : '#FFFFFF',
			borderTopLeftRadius: 22,
			borderTopRightRadius: 22,
			paddingHorizontal: 12,
			paddingBottom: 24,
			paddingTop: 8,
		},
		datePickerHandle: {
			width: 40,
			height: 4,
			borderRadius: 2,
			backgroundColor: isDark ? '#3A3A40' : '#D8D8E0',
			alignSelf: 'center',
			marginTop: 10,
			marginBottom: 10,
		},
		datePickerActions: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			gap: 16,
			marginTop: 10,
			paddingHorizontal: 8,
		},
		datePickerActionText: {
			fontFamily: 'Anaheim-Bold',
			fontSize: 15,
			paddingVertical: 8,
			paddingHorizontal: 10,
		},
	})

	return (
		<SafeAreaView style={[Colour?.bg ?? { flex: 1 }]} >
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			<KeyboardAvoidingView
				style={[styles.container, Colour?.bg]}
				behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
			>
				<ScrollView
					contentContainerStyle={styles.formContainer}
					showsVerticalScrollIndicator={false}
				>
					<Text style={[TEXT?.heading, styles.headerText]}>Set up your profile</Text>
					<Text style={styles.subtitle}>Tell us a bit about yourself to get started</Text>

					<View style={styles.avatarWrap}>
						<TouchableOpacity onPress={pickAndCropImage}>
							<Image
								source={{ uri: imageUri.path }}
								style={styles.avatarImage} />
							<View style={styles.avatarEditBadge}>
								<Feather name="camera" size={14} color="#fff" />
							</View>
						</TouchableOpacity>
						<Text style={styles.avatarHint}>Tap to change photo</Text>
					</View>

					<View style={styles.inputWrap}>
						<Text style={styles.inputLabel}>Full name</Text>
						<View style={styles.inputRow}>
							<Feather name="user" size={18} color={mutedcolor} style={styles.inputIcon} />
							<TextInput
								placeholder='Enter fullname'
								placeholderTextColor={placeholdercolor}
								value={fullname}
								onChangeText={setFullName}
								textAlignVertical='top'
								keyboardType='default'
								maxLength={40}
								style={styles.nameInput} />
						</View>
					</View>

					<View style={styles.inputWrap}>
						<Text style={styles.inputLabel}>Bio</Text>
						<View style={styles.bioRow}>
							<TextInput
								style={styles.bioInput}
								placeholder="Enter bio"
								placeholderTextColor={placeholdercolor}
								value={bio}
								onChangeText={setBio}
								textAlignVertical="top"
								multiline
								keyboardType="default"
								maxLength={400} />
						</View>
						<Text style={styles.lengthText}>{bio.length}/400</Text>
					</View>

					<View style={styles.inputWrap}>
						<Text style={styles.inputLabel}>Date of birth</Text>
						<TouchableOpacity
							style={styles.inputRow}
							onPress={openDatePicker}
						>
							<MaterialCommunityIcons name="calendar-outline" size={18} color={mutedcolor} style={styles.inputIcon} />
							{
								dob !== 'Date of Birth' ? (
									<Text style={{ color: fontcolor, fontFamily: "Anaheim-SemiBold", fontSize: 15 }}>{dob}</Text>
								) : (
									<Text style={{ color: placeholdercolor, fontFamily: "Anaheim-SemiBold", fontSize: 15 }}>{dob}</Text>
								)
							}
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={styles.completeBtn}
						onPress={handleProfileUpdate}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color={'#fff'} />
						) : (
							<Text style={styles.completeBtnText}>Complete Setup</Text>
						)}
					</TouchableOpacity>

					<View style={{ height: 50 }} />
				</ScrollView>
			</KeyboardAvoidingView>

			<Modal
				visible={showDatePicker}
				transparent
				animationType="slide"
				onRequestClose={onCancel}
			>
				<View style={styles.datePickerOverlay}>
					<View style={styles.datePickerSheet}>
						<View style={styles.datePickerHandle} />

						<DateTimePicker
							mode="single"
							date={tempDate ?? (dob !== 'Date of Birth' ? undefined : maxDate)}
							minDate={minDate}
							maxDate={maxDate}
							onChange={({ date }) => setTempDate(new Date(date))}
							displayFullDays
							styles={{
								...defaultPickerStyles,
								day_label: { fontFamily: 'Anaheim-SemiBold', color: isDark ? '#F4F4F6' : '#17171B' },
								weekday_label: { fontFamily: 'Anaheim-SemiBold', color: isDark ? '#9A9AA5' : '#75758A' },
								header: { ...defaultPickerStyles.header },
								month_selector_label: { fontFamily: 'Anaheim-Bold', color: isDark ? '#F4F4F6' : '#17171B' },
								year_selector_label: { fontFamily: 'Anaheim-Bold', color: isDark ? '#F4F4F6' : '#17171B' },
								selected: { backgroundColor: accentColor },
								selected_label: { fontFamily: 'Anaheim-Bold', color: '#FFFFFF' },
								today: { borderColor: accentColor, borderWidth: 1 },
								today_label: { fontFamily: 'Anaheim-Bold', color: accentColor },
								selected_month: { backgroundColor: accentColor },
								selected_month_label: { color: '#FFFFFF' },
								selected_year: { backgroundColor: accentColor },
								selected_year_label: { color: '#FFFFFF' },
								month_label: { fontFamily: 'Anaheim-SemiBold', color: isDark ? '#F4F4F6' : '#17171B' },
								year_label: { fontFamily: 'Anaheim-SemiBold', color: isDark ? '#F4F4F6' : '#17171B' },
								disabled_label: { color: isDark ? '#4A4A52' : '#C7C7D1' },
								button_prev_image: { tintColor: accentColor },
								button_next_image: { tintColor: accentColor },
							}}
						/>

						<View style={styles.datePickerActions}>
							<TouchableOpacity onPress={onCancel}>
								<Text style={[styles.datePickerActionText, { color: isDark ? '#9A9AA5' : '#75758A' }]}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={onConfirm}>
								<Text style={[styles.datePickerActionText, { color: isDark ? '#4fe24ac4' : '#06b100c4' }]}>Confirm</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* USERNAME NOT EXIST SNACK */}
            <Snackbar
                visible={fullnameexistsnakcvisible}
                onDismiss={() => setFullNameExistSnackVisible(false)}
                onclick={() => setFullNameExistSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                Enter fullname!
            </Snackbar>

            {/* ENTER ALL FIELD SNACK */}
            <Snackbar
                visible={enterallfieldssnackvisible}
                onDismiss={() => setEnterAllFieldsSnackVisible(false)}
                onclick={() => setEnterAllFieldsSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                Enter all fields!
            </Snackbar>

            {/* NO SPACE IN USERNAME SNACK */}
            <Snackbar
                visible={dobexistsnakcvisible}
                onDismiss={() => setDOBExistSnackVisible(false)}
                onclick={() => setDOBExistSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                Date of Birth required!
            </Snackbar>
		</SafeAreaView>
	)
}

export default SettingUp