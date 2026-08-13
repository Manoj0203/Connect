import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../utils/Theme'
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import emailjs from '@emailjs/react-native'

import auth, { db } from '../services/firebaseAuth';

const AuthScreen = () => {

    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();

    const hasGenerated = useRef(false);

    const [otp, setOTP] = useState('');
    const [genotp, setgenOTP] = useState('');

    const navigate = useNavigation();

    const user = auth.currentUser;

    useEffect(() => {
        if (hasGenerated.current) return;
        hasGenerated.current = true;

        const generateOTP = async () => {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            const tdy = new Date();

            if (tdy.getDate() < docSnap.data().nextOTPTime && docSnap.data()?.otp) {
                Alert.alert('Connect', 'OTP already sent. Please check your email.');
                return;
            }

            const otpi = Math.floor(100000 + Math.random() * 900000);
            setgenOTP(otpi);

            console.log("Generated OTP: ", otpi);

            await updateDoc(docRef, {
                otp: otpi,
                nextOTPTime: new Date(tdy).getDate() + 1,
            });
            // const templateParams =
            // {
            //     email: user.email,
            //     passcode: otpi.toString(),
            // };

            // try
            // {
            //     const result = await emailjs.send(
            //         'service_hk54nof', 
            //         'template_tzjznm8', 
            //         templateParams, 
            //         {
            //             publicKey: '98PAy5Y5-V-pqcagI',
            //         }
            //     );
            //     console.log('SUCCESS!', result.status, result.text);
            // }
            // catch (error)
            // {
            //     console.log('FAILED...', error);
            // }
        }

        generateOTP();
    }, [user])

    const handleOTP = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (parseInt(otp) === docSnap.data().otp) {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                otpVerified: true,
            });
            navigate.replace('Tabs');
        }
        else {
            Alert.alert('Connect', 'Invalid OTP. Please try again.');
        }
    }

    return (
        <SafeAreaView style={{ backgroundColor: isDark ? '#252525' : '#f6f6f6', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '80%', alignItems: 'center' }}>
                <Text style={[TEXT.heading, { fontSize: 24, marginBottom: 20 }]}>Enter OTP</Text>
                <TextInput
                    placeholder='OTP'
                    placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                    style={TEXTINPUT.txtinput}
                    keyboardType='numeric'
                    value={otp}
                    textAlign='center'
                    maxLength={6}
                    onChangeText={setOTP} />

                <TouchableOpacity style={BUTTON.subbtn} onPress={handleOTP}>
                    <Text style={BUTTON.subbtntxt}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[BUTTON.subbtn, { width: '35%' }]} onPress={() => navigate.replace('Login')}>
                    <Text style={BUTTON.subbtntxt}>Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default AuthScreen

const styles = StyleSheet.create({})