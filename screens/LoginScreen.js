import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import auth, { db } from '../services/firebaseAuth';
import { getDoc, doc } from 'firebase/firestore';
import { Snackbar } from 'react-native-paper';
import Modal from 'react-native-modal'
import AlertModal from '../utils/AlertModal';

const LoginScreen = () => {
    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();
    const navigate = useNavigation();

    const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showpasswd, setShowPasswd] = useState(false)

    const [forgotemail, setForgotEmail] = useState('');
    const [forgotpassword, setForgotPassword] = useState('');
    const [showpin, setShowPin] = useState(false);
    const [showforgotpasswd, setShowForgotPasswd] = useState(false);
    const [forgotpin, setForgotPin] = useState('')

    const [forgotpasswordmodal, setForgotPasswordModal] = useState(false)

    const [invalid, setInValidSnackVisible] = useState(false);

    const BACKEND_URL = "http://192.168.1.4:3000/";

    const handleLogin = async () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().twoFactorEnabled === true) {
                    console.log(docSnap.data().authMethod === 'pin');
                    if (docSnap.data().authMethod === 'pin') {
                        navigate.navigate("SetupAuth", {
                            mode: "verify",
                            action: "disable",

                            onSuccess: async () => {
                                navigate.replace('Tabs')
                            },

                            onFail: () => {
                                null
                            }
                        });
                    }
                    return;
                }
                else {
                    navigate.replace('Tabs')
                }
            })
            .catch((error) => {
                setInValidSnackVisible(true);
            })
    }

    const changeForgotPassword = async () => {
        try {
            if (!forgotemail || !forgotpin || !forgotpassword) {
                Alert.alert("Error", "Fill all fields");
                return;
            }
            const response = await fetch(
                `${BACKEND_URL}forgotPassword`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: forgotemail,
                        pin: forgotpin,
                        Password: forgotpassword,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                Alert.alert(
                    "Success",
                    "Password reset successfully"
                );

                // navigation.replace("Login");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <SafeAreaView style={Colour.bg}>
            <StatusBar barStyle={'dark-content'} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '80%', }}>
                <Text style={[TEXT.heading, { marginBottom: '10%' }]}>Login</Text>
                <TextInput
                    placeholder='Email'
                    placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                    style={TEXTINPUT.txtinput}
                    keyboardType='email-address'
                    value={email}
                    onChangeText={setEmail} />
                <View style={{
                    backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                    borderRadius: 8,
                    marginVertical: 6,
                    minWidth: '80%',
                    minHeight: '5%',
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                }}>

                    <TextInput
                        style={{ color: isDark ? '#fff' : '#000', width: '65%', fontFamily: "Anaheim-SemiBold", }}
                        placeholder='Password'
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showpasswd}
                        placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                    <TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
                        {
                            showpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                :
                                <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={BUTTON.subbtn} onPress={handleLogin}>
                    <Text style={BUTTON.subbtntxt}>Login</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={{ color: isDark ? "#fff" : '#000', marginTop: '6%', fontFamily: "Anaheim-Regular", fontSize: 15 }}>New user? </Text>
                    <TouchableOpacity style={{ marginTop: '5%' }} onPress={() => navigate.replace('Signup')}>
                        <Text style={{ color: isDark ? '#06ec06ff' : '#00b300ff', fontFamily: "Anaheim-Bold", fontSize: 15 }}>Sign up</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <Text style={{ color: isDark ? "#fff" : '#000', marginTop: '6%', fontFamily: "Anaheim-Regular", fontSize: 15 }}>Forgot password? </Text>
                    <TouchableOpacity style={{ marginTop: '5%' }} onPress={() => setForgotPasswordModal(true)}>
                        <Text style={{ color: isDark ? '#06ec06ff' : '#00b300ff', fontFamily: "Anaheim-Bold", fontSize: 15 }}>Click here</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                isVisible={forgotpasswordmodal}
                animationIn={'slideInUp'}
                hasBackdrop
                onBackButtonPress={() => setForgotPasswordModal(false)}
                onBackdropPress={() => setForgotPasswordModal(false)}
                style={{ justifyContent: 'flex-end', }}>
                <View style={{ bottom: -19, }}>
                    <View id='Current Passwd' style={{ backgroundColor: isDark ? '#333' : '#fff', padding: 15, borderRadius: 8, alignItems: 'center', }}>
                        <Text style={[TEXT.subheading, { alignSelf: 'center', marginBottom: 10, }]}>Forgot Password</Text>
                        <TextInput
                            placeholder='Email'
                            placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                            style={[TEXTINPUT.txtinput, { minWidth: '97%' }]}
                            keyboardType='email-address'
                            value={forgotemail}
                            onChangeText={setForgotEmail} />

                        <View style={{
                            backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                            borderRadius: 8,
                            marginVertical: 6,
                            minWidth: '95%',
                            minHeight: '5%',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                        }}>

                            <TextInput
                                style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                                placeholder='Pin'
                                value={forgotpin}
                                onChangeText={setForgotPin}
                                secureTextEntry={!showpin}
                                placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                            <TouchableOpacity onPress={() => setShowPin(!showpin)}>
                                {
                                    showpin ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                        :
                                        <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                }
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                            borderRadius: 8,
                            marginVertical: 6,
                            minWidth: '95%',
                            minHeight: '5%',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                        }}>

                            <TextInput
                                style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                                placeholder='New Password'
                                value={forgotpassword}
                                onChangeText={setForgotPassword}
                                secureTextEntry={!showforgotpasswd}
                                placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                            <TouchableOpacity onPress={() => setShowForgotPasswd(!showforgotpasswd)}>
                                {
                                    showforgotpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                        :
                                        <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                }
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={BUTTON.subbtn} onPress={changeForgotPassword}>
                            <Text style={BUTTON.subbtntxt}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
        </SafeAreaView>
    )
}

export default LoginScreen

const styles = StyleSheet.create({})