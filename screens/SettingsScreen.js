import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal'

import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import { Divider, Snackbar } from 'react-native-paper';

import { sendPasswordResetEmail, signOut, EmailAuthProvider, reauthenticateWithCredential,  } from 'firebase/auth';
import auth, { db } from '../services/firebaseAuth';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';

const SettingsScreen = () => {
	const navi = useNavigation ();
	
	const {Colour, isDark, TEXTINPUT, PROFILEPIC, BUTTON, TEXT} = useTheme();
	const buttoncard = isDark?'#5c5c5cff':'#d5d5d5ff';

	const user = auth.currentUser;

	const [Email, setEmail] = useState('')
	const [currpasswd, setCurrPasswd] = useState('')
	const [showpasswd, setShowPasswd] = useState(false)
	const [isdeletemodalvisible, setIsDeleteModalVisible] = useState(false)

	const [invalid, setInValidSnackVisible] = useState(false);
	
	const placeholdercolor = isDark?'#acacacff':'#7e7e7eff';

	const handleSignout = async () =>
	{
		try{
            const docRef = doc(db, 'users', user.uid);
			await updateDoc(docRef, {
				otpVerified:false,
				nextOTPTime:0,
				otp:null,
			});
			await auth.signOut();
			navi.replace('Login');
		}
		catch(e){
			console.log(e);
		}
	}

	const deleteAccount = async () =>
	{
		if(!user)
		{
			navi.replace('Login')
			return;
		}

		try
		{
			const Crendential = EmailAuthProvider.credential(Email, currpasswd);
			await reauthenticateWithCredential(user, Crendential);

			await deleteDoc(doc(db, 'users', user.uid));
			await user.delete();

			const docRef = collection(db, 'posts');
			const docSnap = await getDocs(docRef);

			docSnap.docs.map((item) =>
			{
				if(item.data().userID === user.uid)
				{
					deleteDoc(doc(db, 'posts', item.data().postID))
				}
			})

			navi.replace('Login');
		}
		catch(e)
		{
			setInValidSnackVisible(true)
		}
	}

	const styles = StyleSheet.create({
		container:
		{
			backgroundColor: isDark?'#252525':'#fff',
			flex:1,
		},
		header:
		{
			width:'100%',
			flexDirection:'row',
			alignItems:'center',
			paddingHorizontal:'3%',
			gap:15
		},
	})

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle={'dark-content'} />
			{/* HEADER */}
			<View style={styles.header}>
				{/* APP NAME */}
				<TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={isDark?"#fff":'#000'} />
                </TouchableOpacity>
				<Text style={TEXT.heading}>Settings</Text>
			</View>

			<ScrollView style={{width:'95%',alignSelf:'center'}}>
				{/* SECURITY */}
				<View id='Security' style={{}}>
					<Text style={TEXT.subheading}>Security</Text>
					<View style={{backgroundColor:buttoncard, width:'95%', padding:5, alignSelf:'center', marginLeft:-10, borderRadius:8}}>
						{/* SECURITY INFO */}
						<TouchableOpacity onPress={() => navi.navigate('Securityinfo')} style={{flexDirection:'row', justifyContent:'space-between', width:'75%', alignItems:'center', marginBottom:8}}>
							<Text style={[BUTTON.settingbtntxt, {}]}>Change security info</Text>
							{/* <AntDesign name="right" size={18} color={isDark?'#acacacff':'#7e7e7eff'} style={{marginTop:5}} /> */}
						</TouchableOpacity>
						<Divider style={{width:'75%', backgroundColor:'#fff', height:.5}} />
						{/* 2 FACTOR AUTHENTICATION */}
						<TouchableOpacity onPress={() => navi.navigate('TwoFact')} style={{flexDirection:'row', justifyContent:'space-between', width:'75%', alignItems:'center', marginTop:5, marginBottom:8}}>
							<Text style={[BUTTON.settingbtntxt, {}]}>2 factor authentication</Text>
							{/* <AntDesign name="right" size={18} color="black" /> */}
						</TouchableOpacity>
						<Divider style={{width:'75%', backgroundColor:'#fff', height:.5}} />
						{/* VERIFICATION BADGE */}
						<TouchableOpacity style={{flexDirection:'row', justifyContent:'space-between', width:'75%', alignItems:'center', marginTop:5, marginBottom:8}}>
							<Text style={[BUTTON.settingbtntxt, {}]}>Get verification badge</Text>
							{/* <AntDesign name="right" size={18} color="black" /> */}
						</TouchableOpacity>
					</View>
				</View>

				{/* ACCOUNT */}
				<View id='Account' style={{}}>
					<Text style={TEXT.subheading}>Account</Text>
					<View style={{backgroundColor:buttoncard, width:'95%', padding:5, alignSelf:'center', marginLeft:-10, borderRadius:8}}>
						{/* SIGNOUT */}
						<TouchableOpacity onPress={handleSignout} style={{flexDirection:'row', justifyContent:'space-between', width:'95%', alignItems:'center', marginBottom:8}}>
							<Text style={[BUTTON.settingbtntxt, {color:isDark?'#06ec06ff':'#00af00ff'}]}>Signout</Text>
							{/* <AntDesign name="right" size={18} color="black" /> */}
						</TouchableOpacity>
						<Divider style={{width:'75%', backgroundColor:'#fff', height:.5}} />
						{/* DELETE */}
						<TouchableOpacity onPress={() => setIsDeleteModalVisible(true)} style={{flexDirection:'row', justifyContent:'space-between', width:'95%', alignItems:'center', marginTop:5}}>
							<Text style={[BUTTON.settingbtntxt, {color:'#ff4141'}]}>Delete</Text>
							{/* <AntDesign name="right" size={18} color="black" /> */}
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>

			{/* DELETE ACCOUNT */}
			<Modal
				isVisible={isdeletemodalvisible}
				animationIn={'rubberBand'}
				hasBackdrop
				onBackButtonPress={() => setIsDeleteModalVisible(false)}
				onBackdropPress={() => setIsDeleteModalVisible(false)}
				style={{justifyContent:'center',}} >
					<View style={{backgroundColor:isDark?'#333':'#fff', padding:0, borderRadius:8, alignItems:'center',}}>
						<Text style={[TEXT.subheading, {alignSelf:'center', marginBottom:10,}]}>Delete Account</Text>

						<TextInput
							placeholder='Email'
							placeholderTextColor={isDark?'#acacacff':'#7e7e7eff'}
							style={[TEXTINPUT.txtinput, {width:'85%'}]}
							keyboardType='email-address'
							value={Email}
							onChangeText={setEmail} />
						
							<View style={{backgroundColor:isDark?'#666666dc':'#dadadadc',
								borderRadius:8,
								marginVertical:6,
								width:'85%',
								minHeight:'5%', 
								justifyContent:'space-between',
								flexDirection:'row',}}>
							
								<TextInput
									style={{color:isDark?'#fff':'#000', width: '85%', fontFamily: "Anaheim-SemiBold",}}
									placeholder='Password'
									value={currpasswd}
									onChangeText={setCurrPasswd}
									secureTextEntry={!showpasswd}
									placeholderTextColor={isDark?'#acacacff':'#7e7e7eff'} />
									<TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
										{
											showpasswd? <Entypo name="eye" size={20} color={placeholdercolor} style={{alignSelf:'center', top:'22%', marginRight:'5%', justifyContent:'center'}} />
											:
											<Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{alignSelf:'center', top:'22%', marginRight:'5%', justifyContent:'center'}} />
										}
									</TouchableOpacity>
							</View>

							<TouchableOpacity style={{borderWidth:3, borderColor:isDark?'#06ec06ff':'#00cc00ff', paddingVertical:10, width:'55%', borderRadius:8, alignItems:'center', marginVertical:'5%'}} onPress={deleteAccount}>
								<Text style={BUTTON.subbtntxt}>Confirm Delete</Text>
							</TouchableOpacity>

					</View>

				{/* INVALID CREDENTIALS SNACK */}
				<Snackbar
					visible={invalid}
					onDismiss={()=>setInValidSnackVisible(false)}
					onclick={() => setInValidSnackVisible(false)}
					duration={3000}
					wrapperStyle={{position:'absolute'}}
					style={{height:'auto'}}
					sidebg={{backgroundColor:'rgba(255, 71, 71, 1)'}}>
					Invalid credentials!
				</Snackbar>

			</Modal>
		</SafeAreaView>
	)
}

export default SettingsScreen;