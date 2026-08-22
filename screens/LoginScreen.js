import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native'
import AlertModal from '../utils/AlertModal';
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import auth, { db } from '../services/firebaseAuth';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { Snackbar } from 'react-native-paper';
import Modal from 'react-native-modal'
import AsyncStorage from "@react-native-async-storage/async-storage";

import { GoogleSignin } from '@react-native-google-signin/google-signin';

const LoginScreen = () => {

    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', singleButton: true, onConfirm: null, btnText: 'Okay' });
    const showAlert = (title, message, buttons) => {
        if (buttons && buttons.length > 1) {
            const confirmBtn = buttons.find(b => b.text !== 'Cancel' && b.style !== 'cancel') || buttons[1];
            setAlertConfig({ visible: true, title, message, singleButton: false, onConfirm: confirmBtn.onPress, btnText: confirmBtn.text || 'Okay' });
        } else {
            setAlertConfig({ visible: true, title, message, singleButton: true, onConfirm: null, btnText: 'Okay' });
        }
    };
    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON, SPACING, RADIUS } = useTheme();
    const navigate = useNavigation();

    const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'
    const accent = isDark ? '#06ec06' : '#00B341';
    const accentSoft = isDark ? '#173620' : '#E6F9EC';
    const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
    const border = isDark ? '#2E2E33' : '#E7E7ED';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';

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

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/";

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '264923450484-r1vq08uh825spisdckt33fn866v7r776.apps.googleusercontent.com'
        })
    }, [])

    async function onGoogleSignIn() {
        try {
            await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            });

            // Sign out first to force the account picker to appear
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not currently signed in
            }

            const signInResult = await GoogleSignin.signIn();

            const email = signInResult?.user?.email || signInResult?.data?.user?.email;
            if (email) {
                const q = query(collection(db, 'users'), where('email', '==', email));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    await GoogleSignin.signOut();
                    showAlert("Account Not Found", "You do not have an account yet. Please sign up.");
                    navigate.replace('Signup');
                    return;
                }
            }

            // Support different package versions
            const idToken =
                signInResult?.idToken ||
                signInResult?.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            const credential =
                GoogleAuthProvider.credential(idToken);

            const userCredential = await signInWithCredential(
                auth,
                credential
            );

            const user = userCredential.user;
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().twoFactorEnabled === true) {
                if (docSnap.data().authMethod === 'pin') {
                    navigate.navigate("SetupAuth", {
                        mode: "verify",
                        action: "disable",
                        onSuccess: async () => {
                            await AsyncStorage.setItem(`2fa_verified_${user.uid}`, 'true');
                            navigate.replace('Tabs');
                        },
                        onFail: () => {
                            null
                        }
                    });
                }
                return;
            } else {
                await AsyncStorage.setItem(`2fa_verified_${user.uid}`, 'true');
                navigate.replace('Tabs');
            }

        } catch (error) {
            console.log('Google Sign-In Error:', error);
        }
    }

    const signOut = async () => {
        try {
            setErrorMessage('');

            await GoogleSignin.signOut();
            await auth.signOut();

            navi.replace('Welcome');

        } catch (error) {
        }
    };

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
                showAlert("Error", "Fill all fields");
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
                showAlert(
                    "Success",
                    "Password reset successfully"
                );

                // navigation.replace("Login");
            } else {
                showAlert("Error", result.message);
            }
        } catch (error) {
            console.log(error)
        }
    }

    const styles = StyleSheet.create({
        scrollContent: {
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
        },
        formWrap: {
            width: '85%',
            alignItems: 'center',
        },
        logoCircle: {
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
        },
        subtitle: {
            color: mutedcolor,
            fontFamily: 'Anaheim-Regular',
            fontSize: 14,
            marginTop: 4,
            marginBottom: 28,
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
            backgroundColor: isDark ? '#1C1C1F' : '#EFEFF4',
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
        textInput: {
            flex: 1,
            color: fontcolor,
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 15,
        },
        loginBtn: {
            width: '100%',
            backgroundColor: accent,
            borderRadius: RADIUS?.md ?? 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 14,
            shadowColor: accent,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },
        loginBtnText: {
            color: isDark ? '#000' : '#fff',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
        },
        bottomRow: {
            flexDirection: 'row',
            marginTop: 22,
        },
        bottomText: {
            color: mutedcolor,
            fontFamily: 'Anaheim-Regular',
            fontSize: 14.5,
        },
        bottomLink: {
            color: accent,
            fontFamily: 'Anaheim-Bold',
            fontSize: 14.5,
        },
        forgotRow: {
            flexDirection: 'row',
            alignSelf: 'flex-end',
            marginTop: 0,
        },
        modalCard: {
            backgroundColor: cardBg,
            padding: 20,
            paddingTop: 14,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: border,
        },
        modalHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: isDark ? '#3A3A40' : '#D8D8E0',
            alignSelf: 'center',
            marginBottom: 14,
        },
        modalIconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: 10,
        },
        modalSubtitle: {
            color: mutedcolor,
            fontFamily: 'Anaheim-Regular',
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 16,
        },
    })

    return (
        <SafeAreaView style={[Colour?.bg ?? { flex: 1 }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.formWrap}>

                        <View style={styles.logoCircle}>
                            <MaterialCommunityIcons name="account-circle-outline" size={32} color={accent} />
                        </View>
                        <Text style={TEXT?.heading}>Welcome back</Text>
                        <Text style={styles.subtitle}>Login to continue</Text>

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputRow}>
                                <Feather name="mail" size={18} color={mutedcolor} style={styles.inputIcon} />
                                <TextInput
                                    placeholder='you@example.com'
                                    placeholderTextColor={placeholdercolor}
                                    style={styles.textInput}
                                    keyboardType='email-address'
                                    autoCapitalize='none'
                                    value={email}
                                    onChangeText={setEmail} />
                            </View>
                        </View>

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputRow}>
                                <Feather name="lock" size={18} color={mutedcolor} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder='Password'
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showpasswd}
                                    placeholderTextColor={placeholdercolor} />
                                <TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
                                    {
                                        showpasswd ? <Entypo name="eye" size={20} color={mutedcolor} />
                                            :
                                            <Entypo name="eye-with-line" size={20} color={mutedcolor} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                            <Text style={styles.loginBtnText}>Login with Email</Text>
                        </TouchableOpacity>

                        <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24}}>
                            <View style={{flex: 1, height: 1, backgroundColor: border}} />
                            <Text style={{width: 50, textAlign: 'center', color: mutedcolor, fontFamily: 'Anaheim-SemiBold'}}>OR</Text>
                            <View style={{flex: 1, height: 1, backgroundColor: border}} />
                        </View>

                        <TouchableOpacity onPress={onGoogleSignIn} style={[styles.loginBtn, { backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF', marginTop: 0, borderWidth: 1, borderColor: isDark ? '#2E2E33' : '#D8D8D8' }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                <Image source={require('../assets/images/google.png')} style={{width: 22, height: 22, marginRight: 12}} />
                                <Text style={[styles.loginBtnText, { color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-SemiBold' }]}>Sign in with Google</Text>
                            </View>
                        </TouchableOpacity>

                        {/* <View style={styles.forgotRow}>
                            <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 13.5 }}>Forgot password? </Text>
                            <TouchableOpacity onPress={() => setForgotPasswordModal(true)}>
                                <Text style={{ color: accent, fontFamily: 'Anaheim-Bold', fontSize: 13.5 }}>Click here</Text>
                            </TouchableOpacity>
                        </View> */}

                        <View style={styles.bottomRow}>
                            <Text style={styles.bottomText}>New user? </Text>
                            <TouchableOpacity onPress={() => navigate.replace('Signup')}>
                                <Text style={styles.bottomLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                isVisible={forgotpasswordmodal}
                animationIn={'slideInUp'}
                hasBackdrop
                onBackButtonPress={() => setForgotPasswordModal(false)}
                onBackdropPress={() => setForgotPasswordModal(false)}
                style={{ justifyContent: 'flex-end', margin: 0 }}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalIconCircle}>
                        <MaterialCommunityIcons name="lock-reset" size={22} color={accent} />
                    </View>
                    <Text style={[TEXT?.subheading, { alignSelf: 'center', marginLeft: 0, textAlign: 'center' }]}>Forgot Password</Text>
                    <Text style={styles.modalSubtitle}>Enter your email, PIN, and a new password</Text>

                    <View style={[styles.inputRow, { marginBottom: 10 }]}>
                        <Feather name="mail" size={18} color={mutedcolor} style={styles.inputIcon} />
                        <TextInput
                            placeholder='Email'
                            placeholderTextColor={placeholdercolor}
                            style={styles.textInput}
                            keyboardType='email-address'
                            autoCapitalize='none'
                            value={forgotemail}
                            onChangeText={setForgotEmail} />
                    </View>

                    <View style={[styles.inputRow, { marginBottom: 10 }]}>
                        <MaterialCommunityIcons name="numeric" size={18} color={mutedcolor} style={styles.inputIcon} />
                        <TextInput
                            style={styles.textInput}
                            placeholder='Pin'
                            value={forgotpin}
                            onChangeText={setForgotPin}
                            secureTextEntry={!showpin}
                            placeholderTextColor={placeholdercolor} />
                        <TouchableOpacity onPress={() => setShowPin(!showpin)}>
                            {
                                showpin ? <Entypo name="eye" size={20} color={mutedcolor} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={mutedcolor} />
                            }
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputRow, { marginBottom: 16 }]}>
                        <Feather name="lock" size={18} color={mutedcolor} style={styles.inputIcon} />
                        <TextInput
                            style={styles.textInput}
                            placeholder='New Password'
                            value={forgotpassword}
                            onChangeText={setForgotPassword}
                            secureTextEntry={!showforgotpasswd}
                            placeholderTextColor={placeholdercolor} />
                        <TouchableOpacity onPress={() => setShowForgotPasswd(!showforgotpasswd)}>
                            {
                                showforgotpasswd ? <Entypo name="eye" size={20} color={mutedcolor} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={mutedcolor} />
                            }
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginBtn} onPress={changeForgotPassword}>
                        <Text style={styles.loginBtnText}>Change Password</Text>
                    </TouchableOpacity>
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
        
            <AlertModal 
                config={alertConfig} 
                onClose={hideAlert} 
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }} 
                isDark={isDark} 
            />
        </SafeAreaView>
    )
}

export default LoginScreen