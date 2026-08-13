import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { FAB, Snackbar } from 'react-native-paper';
import DatePicker from 'react-native-neat-date-picker';
import ImagePicker from 'react-native-image-crop-picker'

import { useTheme } from '../utils/Theme'

import Feather from 'react-native-vector-icons/Feather'
import Entypo from 'react-native-vector-icons/Entypo'

import auth, {db} from '../services/firebaseAuth';

const EditScreen = () => {

    const navi = useNavigation();
    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();
    const user = auth.currentUser;

    const [value, setValue] = useState(null);
    const [imageUri ,setImageUri] = useState()
    const [dumimageUri, setDumImageUri] = useState()


    const [pro_pic, setPro_pic] = useState(false);
    const [username, setUsername] = useState('');
    const [fullname, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [dob, setDOB] = useState('Date of Birth');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [neotext, setNeoText] = useState('');
    
    useEffect(() => {
    // 1. Setup the real-time listener
    const docRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 2. Only update state if the user ISN'T currently picking a new image
            // This prevents the flicker while the user is cropping
            if (!pro_pic) {
                if (data.image) {
                    setImageUri(typeof data.image === 'string' ? data.image : data.image.path);
                }
                setFullName(data?.fullname);
                setUsername(data?.username);
                setBio(data?.bio || '');
                setDOB(data?.dob);
                setNeoText(data?.neotext || '');
            }
            setValue(data);
        }
    });

    // 3. Clean up the listener when the user leaves the screen
    return () => unsubscribe();
}, [pro_pic]); // Add pro_pic as dependency to manage state transitions

    const openDatePicker = () => setShowDatePicker(true);
	const onCancel = () => setShowDatePicker(false);

	const onConfirm = ({ dateString }) => {
		setDOB(dateString.split('-').reverse().join('-')); 
		onCancel();
	};

    const handleUpdate = async () =>
    {
        let data = null;
        if(pro_pic)
        {
            if(dumimageUri)
            {
                const formData = new FormData();
				formData.append('file', {
					uri: dumimageUri.path,
					type: dumimageUri.mime,
					name: dumimageUri.filename || null,
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
        }

        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
            image: data?.secure_url ?? imageUri,
            username: username,
            fullname: fullname,
            bio: bio,
            neotext:neotext,
            dob: dob
        });
    }

    const handleImageSelection = async() =>
    {
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
        setDumImageUri(image);
        setImageUri(image.path);

        } catch (error) {
        if (error.code !== 'E_PICKER_CANCELLED') {
            console.log('ImagePicker Error: ', error);
            Alert.alert('Error', 'Failed to pick or crop image.');
        }
        }
    }

    const placeholdercolor = isDark?'#b5b5b5dc':'#7e7e7eff'

    const styles = StyleSheet.create({
        header:
		{
			width:'75%',
			flexDirection:'row',
			alignItems:'center',
			paddingHorizontal:'3%',
			gap:15,
		},
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        formContainer: {
			flexGrow: 1,
			alignItems: 'center',
			width: '90%',
            paddingBottom:35,
            paddingTop:10
		},
		lengthText: {
			color: isDark ? '#b5b5b5dc' : '#9d9d9ddc',
			alignSelf: 'flex-end',
			marginTop: '-2%',
            fontFamily: "Anaheim-Bold",
		},
    });

  return (
    <SafeAreaView style={{backgroundColor:isDark ? "#121214" : "#F7F7FA", flex:1,}}>
        <View style={{flexDirection:'row'}}>
                {/* HEADER */}
            <View style={styles.header}>
                {/* APP NAME */}
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={isDark?"#fff":'#000'} />
                </TouchableOpacity>
                <Text style={[TEXT.heading, {fontSize:25}]}>Edit Profile</Text>
            </View>
            <View>
                <TouchableOpacity onPress={handleUpdate}>
				    <Text style={[TEXT.usernametxt, {color:isDark ? "#06ec06ff" : '#00cc00ff', fontSize:20}]}>Update</Text>
            	</TouchableOpacity>
            </View>
        </View>

        {/* CONTENT */}
        <KeyboardAvoidingView
            style={[styles.container, Colour.bg]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} >
                
            <ScrollView 
                contentContainerStyle={styles.formContainer}
                showsVerticalScrollIndicator={false}>
                <View style={{marginTop:30, marginBottom:20}}>
                    <TouchableOpacity style={{}} onPress={handleImageSelection}>
                        <Image 
                            source={{uri:imageUri}}
                            style={{width:100, height:100, borderRadius:15}} />
                        <FAB icon={'pencil'} style={{position:'absolute', top:'80%', right:'-10%', backgroundColor:'rgba(0,0,0,0.35)'}} customSize={30} color='#a3a3a3ff' />
                    </TouchableOpacity>
                </View>
                <View style={{width:'100%', maxWidth:'100%'}}>
                    <TextInput 
                        placeholder='Enter username'
                        placeholderTextColor={placeholdercolor}
                        value={username}
                        onChangeText={setUsername}
                        textAlignVertical='top'
                        keyboardType='default'
                        maxLength={40}
                        style={[TEXTINPUT.txtinput,{paddingHorizontal:10, fontFamily: "Anaheim-SemiBold",}]} />
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
                    <TextInput 
                        placeholder='Enter NeoText'
                        placeholderTextColor={placeholdercolor}
                        value={neotext}
                        onChangeText={setNeoText}
                        textAlignVertical='top'
                        keyboardType='default'
                        maxLength={30}
                        style={[TEXTINPUT.txtinput,{paddingHorizontal:10, fontFamily: "Anaheim-Bold", maxWidth:'80%'}]} />
                    <View style={{maxWidth:'100%'}}>
                        <Text style={[TEXT.neonText, {}]}>{neotext? neotext.trim() : 'Text' }</Text>
                    </View>
                    <View style={{width:'80%', alignSelf:'center', flexDirection:'row', alignItems:'center', gap:10,}}>
                        <Entypo name="info-with-circle" size={16} color="gray" />
                        <Text style={{color:'gray', marginTop:5, fontFamily: "Anaheim-Regular", fontSize:14, maxWidth:'95%'}}>
                            NeoText is a special text that appears under your fullname in your profile.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[TEXTINPUT.txtinput, { justifyContent: 'center', marginTop:12}]}
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
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        {/* NeoText under the fullname in profilescreen */}

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

export default EditScreen