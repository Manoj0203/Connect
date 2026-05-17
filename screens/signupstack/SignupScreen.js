import { StyleSheet, Text, View,StatusBar, TextInput, TouchableOpacity, } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import auth, { db }  from '../../services/firebaseAuth';
import { setDoc, doc, query, collection, where, getDocs, getFirestore } from 'firebase/firestore';
import { Snackbar } from 'react-native-paper';

const SignupScreen = () => {

    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();

    const navigate = useNavigation()
    const placeholdercolor = isDark?'#acacacff':'#7e7e7eff'

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showpasswd, setShowPasswd] = useState(false);
    const [userdata, setUserData] = useState();

    // SnackBars
    const [usernameexistsnakcvisible, setUserNameExistSnackVisible] = useState(false);
    const [enterallfieldssnackvisible, setEnterAllFieldsSnackVisible] = useState(false);
    const [nospaceinusernamesnackvisible, setNoSpaceInUsernameSnackVisible] = useState(false);
    const [passwordlengthsnackvisible, setPasswordLengthSnackVisible] = useState(false);

    const handlesignup = async() =>
    {
        try
        {
            const db = getFirestore();
            const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) 
            {
                setUserNameExistSnackVisible(true);
                return;
            }

            if(!email.trim() || !username.trim() || !password.trim())
            {
                setEnterAllFieldsSnackVisible(true);
                return;
            }
            if(username)
            {
                const lst = username.split(' ');
                if(lst.length >= 2)
                {
                    setNoSpaceInUsernameSnackVisible(true);
                    return;
                }
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username:username.toLowerCase(),
                email:email.toLowerCase(),
                post:0,
                friends:0,
                requests:0,
                createdAt: new Date(),
                isVerified:false,
                postliked: {},
                phone_number: '',
                otp:0,
                otpVerified:false,
                authentication: false,
                nextOTPTime:0,
                neotext:'',
                isSetupComplete:false,
                familyID:null,
            });
            navigate.replace('SettingUp')
        }
        catch (error)
        {
            if(password.length < 6)
            {
                setPasswordLengthSnackVisible(true);
            }
            console.log(error)
        }
    }
    
  return (
    <SafeAreaView style={Colour.bg}>
        <StatusBar barStyle={'dark-content'} />
        <View style={{flex:1, alignItems:'center', justifyContent:'center', width:'80%'}}>
            <Text style={[TEXT.heading, {marginBottom:'10%'}]}> Sign up </Text>
            <TextInput
                placeholder='Username'
                placeholderTextColor={isDark?'#acacacff':'#7e7e7eff'}
                style={TEXTINPUT.txtinput}
                value={username}
                onChangeText={setUsername} />
            <TextInput
                placeholder='Email'
                placeholderTextColor={isDark?'#acacacff':'#7e7e7eff'}
                style={TEXTINPUT.txtinput}
                keyboardType='email-address'
                value={email}
                onChangeText={setEmail} />
            
            <View style={{backgroundColor:isDark?'#666666dc':'#dadadadc',
                borderRadius:8,
                marginVertical:6,
                minWidth:'80%',
                minHeight:'5%', 
                justifyContent:'space-between',
                flexDirection:'row',}}>
            
                <TextInput
                    style={{color:isDark?'#fff':'#000', width: '65%', fontFamily: "Anaheim-SemiBold",}}
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
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
            <TouchableOpacity style={BUTTON.subbtn} onPress={handlesignup}>
                <Text style={BUTTON.subbtntxt}>Sign up</Text>
            </TouchableOpacity>
            <View style={{flexDirection:'row'}}>
                <Text style={{color:isDark?"#fff":'#000', marginTop:'6%', fontFamily: "Anaheim-Regular", fontSize:15}}>Already have account? </Text>
                <TouchableOpacity style={{ marginTop:'5%'}} onPress={() => navigate.replace('Login')}>
                    <Text style={{color:isDark?'#06ec06ff':'#00cc00ff', fontFamily: "Anaheim-Bold", fontSize:15}}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* USERNAME NOT EXIST SNACK */}
        <Snackbar
            visible={usernameexistsnakcvisible}
            onDismiss={()=>setUserNameExistSnackVisible(false)}
            onclick={() => setUserNameExistSnackVisible(false)}
            duration={3000}
            wrapperStyle={{position:'absolute'}}
            sidebg={{backgroundColor:'rgba(255, 71, 71, 1)'}}>
            username already in use!
        </Snackbar>

        {/* ENTER ALL FIELD SNACK */}
        <Snackbar
            visible={enterallfieldssnackvisible}
            onDismiss={()=>setEnterAllFieldsSnackVisible(false)}
            onclick={() => setEnterAllFieldsSnackVisible(false)}
            duration={3000}
            wrapperStyle={{position:'absolute'}}
            sidebg={{backgroundColor:'rgba(255, 71, 71, 1)'}}>
            Enter all fields!
        </Snackbar>

        {/* NO SPACE IN USERNAME SNACK */}
        <Snackbar
            visible={nospaceinusernamesnackvisible}
            onDismiss={()=>setNoSpaceInUsernameSnackVisible(false)}
            onclick={() => setNoSpaceInUsernameSnackVisible(false)}
            duration={3000}
            wrapperStyle={{position:'absolute'}}
            sidebg={{backgroundColor:'rgba(255, 71, 71, 1)'}}>
            No spaces allowed in username!
        </Snackbar>

        {/* PASSWORD LENGTH 6 SNACK */}
        <Snackbar
            visible={passwordlengthsnackvisible}
            onDismiss={()=>setPasswordLengthSnackVisible(false)}
            onclick={() => setPasswordLengthSnackVisible(false)}
            duration={3000}
            wrapperStyle={{position:'absolute'}}
            style={{height:'auto'}}
            sidebg={{backgroundColor:'rgba(255, 71, 71, 1)'}}>
            Password should be at least 6 characters long!
        </Snackbar>
    </SafeAreaView>
  )
}

export default SignupScreen