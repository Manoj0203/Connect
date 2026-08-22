import { StyleSheet, Text, View, StatusBar, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import auth, { db } from '../../services/firebaseAuth';
import { setDoc, doc, query, collection, where, getDocs, getFirestore, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Snackbar } from 'react-native-paper';

const SignupScreen = () => {

    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON, RADIUS } = useTheme();

    const navigate = useNavigation()
    const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'
    const accent = isDark ? '#06ec06' : '#00B341';
    const accentSoft = isDark ? '#173620' : '#E6F9EC';
    const border = isDark ? '#2E2E33' : '#E7E7ED';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showpasswd, setShowPasswd] = useState(false);
    const [activesignupbtn, setActiveSignUpButton] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // SnackBars
    const [usernameexistsnakcvisible, setUserNameExistSnackVisible] = useState(false);
    const [enterallfieldssnackvisible, setEnterAllFieldsSnackVisible] = useState(false);
    const [usernamerequiredsnackvisible, setUsernameRequiredSnackVisible] = useState(false);
    const [nospaceinusernamesnackvisible, setNoSpaceInUsernameSnackVisible] = useState(false);
    const [passwordlengthsnackvisible, setPasswordLengthSnackVisible] = useState(false);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '264923450484-r1vq08uh825spisdckt33fn866v7r776.apps.googleusercontent.com'
        })
    }, [])

    const handleGoogleSignUp = async () => {
        if (!username.trim()) {
            setUsernameRequiredSnackVisible(true);
            return;
        }
        const lst = username.split(' ');
        if (lst.length >= 2) {
            setNoSpaceInUsernameSnackVisible(true);
            return;
        }
        setIsLoading(true);
        setActiveSignUpButton(true);

        try {
            const db = getFirestore();
            const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setUserNameExistSnackVisible(true);
                setIsLoading(false);
                setActiveSignUpButton(false);
                return;
            }

            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            try { await GoogleSignin.signOut(); } catch (e) {}

            const signInResult = await GoogleSignin.signIn();
            const idToken = signInResult?.idToken || signInResult?.data?.idToken;
            
            if (!idToken) throw new Error('No ID token received');
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    username: username.toLowerCase(),
                    email: user.email,
                    post: 0,
                    friends: 0,
                    requests: 0,
                    createdAt: new Date(),
                    isVerified: false,
                    postliked: {},
                    phone_number: "",
                    otp: 0,
                    otpVerified: false,
                    authentication: false,
                    nextOTPTime: 0,
                    neotext: "",
                    isSetupComplete: false,
                    familyID: null,
                });
                navigate.replace("SettingUp");
            } else {
                if (docSnap.data().isSetupComplete === false) {
                    navigate.replace("SettingUp");
                } else {
                    navigate.replace("Tabs");
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
            setActiveSignUpButton(false);
        }
    }

    const handlesignup = async () => {
        setIsLoading(true);
        setActiveSignUpButton(true);
        try {
            const db = getFirestore();
            const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setUserNameExistSnackVisible(true);
                return;
            }

            if (!email.trim() || !username.trim() || !password.trim()) {
                setEnterAllFieldsSnackVisible(true);
                return;
            }
            if (username) {
                const lst = username.split(' ');
                if (lst.length >= 2) {
                    setNoSpaceInUsernameSnackVisible(true);
                    return;
                }
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await new Promise((resolve, reject) => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if (user) {
                        unsubscribe();
                        resolve(user);
                    }
                });

                setTimeout(() => {
                    unsubscribe();
                    reject(new Error("Authentication timeout"));
                }, 10000);
            });

            const user = auth.currentUser;

            if (!user) {
                throw new Error("Authentication failed");
            }

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                post: 0,
                friends: 0,
                requests: 0,
                createdAt: new Date(),
                isVerified: false,
                postliked: {},
                phone_number: "",
                otp: 0,
                otpVerified: false,
                authentication: false,
                nextOTPTime: 0,
                neotext: "",
                isSetupComplete: false,
                familyID: null,
            });

            navigate.replace("SettingUp");
        }
        catch (error) {
            if (password.length < 6) {
                setPasswordLengthSnackVisible(true);
            }
            console.log(error)
        }
        finally {
            setIsLoading(false)
            setActiveSignUpButton(false)
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
            marginVertical: -5
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
        signupBtn: {
            width: '100%',
            backgroundColor: accent,
            borderRadius: RADIUS?.md ?? 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 6,
            shadowColor: accent,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },
        signupBtnText: {
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
                            <MaterialCommunityIcons name="account-plus-outline" size={32} color={accent} />
                        </View>
                        <Text style={TEXT?.heading}>Create account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>Username <Text style={{color: '#ff4747'}}>*</Text></Text>
                            <View style={styles.inputRow}>
                                <Feather name="user" size={18} color={mutedcolor} style={styles.inputIcon} />
                                <TextInput
                                    placeholder='Choose a unique username'
                                    placeholderTextColor={placeholdercolor}
                                    style={styles.textInput}
                                    autoCapitalize='none'
                                    value={username}
                                    onChangeText={setUsername} />
                            </View>
                            <Text style={{color: mutedcolor, fontFamily: 'Anaheim-Regular', fontSize: 12, marginTop: 4, marginLeft: 4}}>Required for both Google and Email sign up.</Text>
                        </View>

                        <TouchableOpacity disabled={activesignupbtn} onPress={handleGoogleSignUp} style={[styles.signupBtn, { backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF', marginTop: 10, borderWidth: 1, borderColor: isDark ? '#2E2E33' : '#D8D8D8' }]}>
                            {
                                isLoading ?
                                    <ActivityIndicator size={'large'} color={isDark ? '#fff' : '#000'} />
                                    :
                                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                        <Image source={require('../../assets/images/google.png')} style={{width: 22, height: 22, marginRight: 12}} />
                                        <Text style={[styles.signupBtnText, { color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-SemiBold' }]}>Sign up with Google</Text>
                                    </View>
                            }
                        </TouchableOpacity>

                        <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24}}>
                            <View style={{flex: 1, height: 1, backgroundColor: border}} />
                            <Text style={{width: 50, textAlign: 'center', color: mutedcolor, fontFamily: 'Anaheim-SemiBold'}}>OR</Text>
                            <View style={{flex: 1, height: 1, backgroundColor: border}} />
                        </View>

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

                        <TouchableOpacity disabled={activesignupbtn} style={styles.signupBtn} onPress={handlesignup}>
                            {
                                isLoading ?
                                    <ActivityIndicator size={'large'} color={isDark ? '#000' : '#fff'} />
                                    :
                                    <Text style={styles.signupBtnText}>Sign up with Email</Text>
                            }
                        </TouchableOpacity>

                        <View style={styles.bottomRow}>
                            <Text style={styles.bottomText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigate.replace('Login')}>
                                <Text style={styles.bottomLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* USERNAME NOT EXIST SNACK */}
            <Snackbar
                visible={usernameexistsnakcvisible}
                onDismiss={() => setUserNameExistSnackVisible(false)}
                onclick={() => setUserNameExistSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                username already in use!
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
                visible={nospaceinusernamesnackvisible}
                onDismiss={() => setNoSpaceInUsernameSnackVisible(false)}
                onclick={() => setNoSpaceInUsernameSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                No spaces allowed in username!
            </Snackbar>

            {/* PASSWORD LENGTH 6 SNACK */}
            <Snackbar
                visible={passwordlengthsnackvisible}
                onDismiss={() => setPasswordLengthSnackVisible(false)}
                onclick={() => setPasswordLengthSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                style={{ height: 'auto' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                Password should be at least 6 characters long!
            </Snackbar>

            {/* USERNAME REQUIRED SNACK */}
            <Snackbar
                visible={usernamerequiredsnackvisible}
                onDismiss={() => setUsernameRequiredSnackVisible(false)}
                onclick={() => setUsernameRequiredSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                Please enter a username first!
            </Snackbar>
        </SafeAreaView>
    )
}

export default SignupScreen