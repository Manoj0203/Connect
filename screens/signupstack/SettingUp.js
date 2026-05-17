import { Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, StyleSheet,
    Image, TouchableOpacity, Alert, View, StatusBar, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../utils/Theme'
import DatePicker from 'react-native-neat-date-picker';
import ImagePicker from 'react-native-image-crop-picker';
import * as Burnt from 'burnt'

import auth, {db} from '../../services/firebaseAuth'
import { doc, updateDoc } from 'firebase/firestore'; 
import { useNavigation } from '@react-navigation/native';

const SettingUp = () => {

	const {Colour, isDark, TEXTINPUT, PROFILEPIC, BUTTON, TEXT} = useTheme()
	const [fullname, setFullName] = useState('')
	const [bio, setBio] = useState('')
	const [dob, setDOB] = useState('Date of Birth');
	const defaultImageUri = Image.resolveAssetSource(require('../../assets/images/user.png')).uri;
	const defaultImageUriobj = {path: defaultImageUri}

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [imageUri, setImageUri] = useState(defaultImageUriobj);
	const [pro_pic, setPro_pic] = useState(false);
	
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	const openDatePicker = () => setShowDatePicker(true);
	const onCancel = () => setShowDatePicker(false);

	const onConfirm = ({ dateString }) => {
		setDOB(dateString.split('-').reverse().join('-')); 
		onCancel();
	};

	const pickAndCropImage = async () => {
    try {
      	const image = await ImagePicker.openPicker({
			width: 300,
			height: 300,
			cropperToolbarTitle: 'Profile Picture',
			mediaType: 'photo',
			compressImageQuality:0.6,
			compressImageMaxHeight: 1200,
			compressImageMaxWidth:1200,
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
		
		// if (!fullname.trim()) {
		// 	Burnt.toast({
		// 		title:'Full name required'
		// 	})
		// 	return;
		// }
		// if (dob === 'Date of Birth') {
		// 	Burnt.toast({
		// 		title:'Date of Birth required'
		// 	})
		// 	return;
		// }
		
		const user = auth.currentUser;

		if (!user) {
			return;
		}
		
		setLoading(true);

		
		
		try {
			let data = null;

			if(pro_pic)
			{
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
				image: data?.secure_url ?? imageUri  ,
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

	const placeholdercolor = isDark?'#b5b5b5dc':'#7e7e7eff'
	
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
			width: '80%',
		},
		lengthText: {
			color: isDark ? '#b5b5b5dc' : '#9d9d9ddc',
			alignSelf: 'flex-end',
			marginTop: '-2%',
            fontFamily: "Anaheim-Bold",
		},
        bioInput: {
            height: 170,
            minHeight: 120,
            fontFamily: "Anaheim-SemiBold",
        },
	})

	return (
		<SafeAreaView style={[Colour.bg, {flex: 1}]} >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			<KeyboardAvoidingView
				style={[styles.container, Colour.bg]}
				behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
				keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
			>
				<ScrollView 
                    contentContainerStyle={styles.formContainer}
                    showsVerticalScrollIndicator={false}
                >
					<TouchableOpacity onPress={pickAndCropImage}>
						<Image
							source={{uri:imageUri.path}}	
							style={PROFILEPIC.settinguppic} />
					</TouchableOpacity>

					<TextInput 
						placeholder='Enter fullname'
						placeholderTextColor={placeholdercolor}
						value={fullname}
						onChangeText={setFullName}
						textAlignVertical='top'
						keyboardType='default'
						maxLength={40}
						style={[TEXTINPUT.txtinput,{paddingHorizontal:10, fontFamily: "Anaheim-SemiBold",}]} />
					
					<TextInput
						style={[TEXTINPUT.txtinput, styles.bioInput,]}
						placeholder="Enter bio"
						placeholderTextColor={placeholdercolor}
						value={bio}
						onChangeText={setBio}
						textAlignVertical="top"
						multiline
						keyboardType="default"
						maxLength={400} />
					<Text style={styles.lengthText}>{bio.length}/400</Text>
					
					<TouchableOpacity
						style={[TEXTINPUT.txtinput, { justifyContent: 'center', }]}
						onPress={openDatePicker}
					>
						{
							dob !== 'Date of Birth' ? (
							<Text style={{ color: isDark?"#fff":'#000', marginLeft:'2%', fontFamily: "Anaheim-SemiBold", }}>{dob}</Text>
							) : (
							<Text style={{ color: placeholdercolor, marginLeft:'2%', fontFamily: "Anaheim-SemiBold", }}>{dob}</Text>
							)
						}
					</TouchableOpacity>

					<TouchableOpacity
						style={[BUTTON.subbtn, {width:'56%'}]}
						onPress={handleProfileUpdate}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color={[TEXT.heading]} />
						) : (
							<Text style={[BUTTON.subbtntxt,{paddingHorizontal:27, paddingVertical:2}]}>Complete Setup</Text>
						)}
					</TouchableOpacity>

                    <View style={{height: 50}} />
				</ScrollView>
			</KeyboardAvoidingView>

			<DatePicker
				isVisible={showDatePicker}
				mode={'single'}
				onCancel={onCancel}
				onConfirm={onConfirm}
				maxDate={new Date()}
				chooseYearFirst 
				colorOptions={{
					headerColor: isDark ? '#4fe24ac4' : '#06b100c4',
					backgroundColor: isDark ? '#454545' : '#fff',
					changeYearModalColor: isDark ? '#4fe24ac4' : '#06b100c4',
					weekDaysColor: isDark ? '#4fe24ac4' : '#06b100c4',
					dateTextColor: isDark ? '#fff' : '#8f8f8fff',
					confirmButtonColor: isDark ? '#4fe24ac4' : '#06b100c4',
					selectedDateTextColor: isDark ? '#ffffff' : '#b6b6b6ff',
					selectedDateBackgroundColor: isDark ? '#4fe24ac4' : '#06b100c4',
				}}
			/>
		</SafeAreaView>
	)
}

export default SettingUp