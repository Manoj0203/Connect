import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import auth, {db} from '../services/firebaseAuth';
import { getDoc, doc } from 'firebase/firestore';
import { Snackbar } from 'react-native-paper';

const LoginScreen = () => {
    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();
    const navigate = useNavigation();

    const placeholdercolor = isDark?'#acacacff':'#7e7e7eff'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showpasswd, setShowPasswd] = useState(false)

    const [invalid, setInValidSnackVisible] = useState(false);

    const handleLogin =async() =>
    {
        signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) =>{
            const user = userCredential.user;
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if(docSnap.exists() && docSnap.data().authentication === true)
            {
                navigate.replace('Auth');
                return;
            }
            else{
                navigate.replace('Tabs')
            }
        })
        .catch((error)=>{
            setInValidSnackVisible(true);
        })
    }
    
  return (
    <SafeAreaView style={Colour.bg}>
        <StatusBar barStyle={'dark-content'} />
        <View style={{flex:1, alignItems:'center', justifyContent:'center', width:'80%', }}>
            <Text style={[TEXT.heading, {marginBottom:'10%'}]}>Login</Text>
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
            <TouchableOpacity style={BUTTON.subbtn} onPress={handleLogin}>
                <Text style={BUTTON.subbtntxt}>Login</Text>
            </TouchableOpacity>
            <View style={{flexDirection:'row'}}>
                <Text style={{color:isDark?"#fff":'#000', marginTop:'6%', fontFamily: "Anaheim-Regular", fontSize:15}}>New user? </Text>
                <TouchableOpacity style={{ marginTop:'5%'}} onPress={() => navigate.replace('Signup')}>
                    <Text style={{color:isDark?'#06ec06ff':'#00b300ff', fontFamily: "Anaheim-Bold", fontSize:15}}>Sign up</Text>
                </TouchableOpacity>
            </View>
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
    </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({})