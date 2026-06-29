import { Pressable, StyleSheet, Text, TouchableOpacity, View, Animated, Linking } from "react-native";
import React, { useCallback, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Switch } from "react-native-paper";
import Modal from "react-native-modal";

import { useTheme } from "../utils/Theme";
import Feather from "react-native-vector-icons/Feather";
import Entypo from "react-native-vector-icons/Entypo";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

import auth, { db } from "../services/firebaseAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, doc } from "firebase/firestore";

const TwoFactScreen = () => {
    const { isDark, TEXT, BUTTON } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    const buttoncard = isDark ? "#5c5c5cff" : "#d5d5d5ff";

    const [isSwitchOn, setIsSwitchOn] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [typeused, setTypeUsed] = useState('')
    const [showchangeauth, setShowChangeAuth] = useState('');

    const radiuspin = useRef(new Animated.Value(8)).current;
    const radiusfp = useRef(new Animated.Value(8)).current;

    const getSwitchState = async () => {
        try {
            const value = await AsyncStorage.getItem("twoFAtype");

            if (!value) {
                const data = await getDoc(doc(db, 'users', user.uid));
                setIsSwitchOn(data.data().twoFactorEnabled);
                setTypeUsed(data.data().authMethod);
                return;
            }

            const parsed = JSON.parse(value);
            setIsSwitchOn(parsed?.twoFA || false);
            setTypeUsed(parsed?.auth || 'none');
        } catch (error) {
            console.log("getSwitchState error:", error.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            getSwitchState();
        }, [])
    );

    const styles = StyleSheet.create({
        header: {
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: "3%",
            gap: 15
        },
        authButton: {
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderRadius: 8,
            width: 100,
            height: 125
        },
        authButtonText: {
            color: isDark ? "#fff" : "#000",
            fontFamily: "Anaheim-SemiBold",
            top: 7
        },
        AuthType: {
            width: "93%",
            alignSelf: "center",
            marginTop: 20,
            gap: 3,
            backgroundColor: buttoncard,
            borderRadius: 8,
            padding: 10
        }
    });

    const onToggleSwitch = async (value) => {
        if (value) {
            // Enabling — show method picker modal
            setShowMethodModal(true);
            return;
        }

        // Disabling — verify current PIN first
        navi.navigate("SetupAuth", {
            mode: "verify",
            action: "disable",

            onSuccess: async () => {
                setIsSwitchOn(false);
                // Single source of truth for AsyncStorage on disable
                await AsyncStorage.setItem(
                    "twoFAtype",
                    JSON.stringify({
                        twoFA: false,
                        auth: "pin"
                    })
                );
            },

            onFail: () => {
                setIsSwitchOn(true);
            }
        });
    };

    const openPinScreen = () => {
        setShowMethodModal(false);

        navi.navigate("SetupAuth", {
            // mode defaults to 'setup' in SetupAuth so no need to pass it
            onSuccess: async () => {
                setIsSwitchOn(true);
                await AsyncStorage.setItem(
                    "twoFAtype",
                    JSON.stringify({
                        twoFA: true,
                        auth: "pin"
                    })
                );
            },

            onFail: () => {
                setIsSwitchOn(false);
            }
        });
    };

    const openEmail = async () => {
        const email = 'nmanoj0212@gmail.com';

        const body = `I am unable to access my account because I have forgotten my Two-Factor Authentication (2FA) PIN/code.

I would like to request a reset or change of my 2FA settings so that I can regain access to my account.

Thank you for your assistance. I look forward to your response.

Best regards`;

        const url = `mailto:${email}?subject=${encodeURIComponent(
            'Request to Reset Two-Factor Authentication'
        )}&body=${encodeURIComponent(body)}`;

        await Linking.openURL(url);
    };

    return (
        <SafeAreaView
            style={{
                backgroundColor: isDark ? "#252525" : "#f6f6f6",
                flex: 1
            }}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather
                        name="arrow-left"
                        size={24}
                        color={isDark ? "#fff" : "#000"}
                    />
                </TouchableOpacity>
                <Text style={[TEXT.heading]}>Authentication</Text>
            </View>

            <View style={{ width: "95%", alignSelf: "center" }}>
                <View id="Authentication">
                    <Text style={[TEXT.subheading, { fontSize: 19 }]}>
                        Two factor Authentication
                    </Text>
                    <View
                        style={{
                            backgroundColor: buttoncard,
                            width: "95%",
                            padding: 5,
                            alignSelf: "center",
                            marginLeft: -10,
                            borderRadius: 8,
                            paddingVertical: 8
                        }}
                    >
                        {/* ✅ Removed onPress from TouchableOpacity — was double-triggering
                            alongside Switch's onValueChange */}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "95%",
                                alignItems: "center",
                                alignSelf: "center"
                            }}
                        >
                            <Text style={[BUTTON.settingbtntxt]}>Turn On</Text>
                            <Switch
                                value={isSwitchOn}
                                onValueChange={onToggleSwitch}
                                color={isDark ? "#06ec06ff" : "#00cc00ff"}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {isSwitchOn && (
                <>
                    <View
                        style={styles.AuthType}
                    >
                        {/* Auth Type Used here */}
                        <Text style={{
                            fontFamily: 'Anaheim-SemiBold',
                            color: isDark ? '#fff' : '#000',
                            fontSize: 15
                        }}>Authentication Type used: <Text style={{
                            fontFamily: 'Anaheim-Bold',
                            color: isDark ? "#06ec06ff" : "#00cc00ff",
                            fontSize: 17
                        }}>{typeused.toUpperCase()}</Text></Text>

                        {typeused == 'pin' ?
                            <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
                                <Text style={{
                                    fontFamily: 'Anaheim-SemiBold',
                                    color: isDark ? '#d2d2d2' : '#000',
                                    fontSize: 15
                                }}>Forgot Two Authentication?</Text>
                                <TouchableOpacity onPress={() => setShowChangeAuth(!showchangeauth)} style={{ flexDirection: 'row' }}>
                                    <Text style={{
                                        fontFamily: 'Anaheim-Bold',
                                        color: isDark ? "#06ec06ff" : "#00cc00ff",
                                        fontSize: 17
                                    }}>Click Here</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null}

                    </View>
                    {
                        showchangeauth && (
                            <>
                                <View
                                    style={styles.AuthType}
                                >
                                    {/* Mail Heading */}
                                    <Text style={{
                                        fontFamily: 'Anaheim-SemiBold',
                                        color: isDark ? '#d2d2d2' : '#464646',
                                        fontSize: 15
                                    }}>To Team Develax</Text>

                                    {/* Forgot 2 fact auth */}
                                    <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
                                        <Text style={{
                                            fontFamily: 'Anaheim-SemiBold',
                                            color: isDark ? '#d2d2d2' : '#000',
                                            fontSize: 15
                                        }}>{`I am unable to access my account because I have forgotten my Two-Factor Authentication (2FA) PIN/code. I would like to request a reset or change of my 2FA settings so that I can regain access to my account.${'\n'}Thank you for your assistance. I look forward to your response.${'\n'}Thank you for your support.${'\n'}Best regards`}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'center', top: '-3%' }}>
                                    <TouchableOpacity onPress={openEmail} style={BUTTON.subbtn}>
                                        <Text style={BUTTON.subbtntxt}>Send Mail</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )
                    }

                </>

            )}

            <Modal
                isVisible={showMethodModal}
                animationIn="slideInUp"
                hasBackdrop
                onBackButtonPress={() => setShowMethodModal(false)}
                onBackdropPress={() => setShowMethodModal(false)}
                style={{
                    justifyContent: "flex-end",
                    top: "2%",
                    alignItems: "center"
                }}
            >
                <View
                    style={{
                        backgroundColor: isDark ? "#252525" : "#fefefe",
                        width: "105%",
                        height: 250,
                        borderRadius: 12
                    }}
                >
                    <Text style={[TEXT.subheading, { paddingVertical: 10 }]}>
                        Authentication Method
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignSelf: "center",
                            gap: "20%",
                            marginTop: "5%"
                        }}
                    >
                        <Pressable
                            onPressIn={() => {
                                Animated.timing(radiuspin, {
                                    toValue: 15,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onPressOut={() => {
                                Animated.timing(radiuspin, {
                                    toValue: 8,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onPress={openPinScreen}
                        >
                            <Animated.View
                                style={[
                                    styles.authButton,
                                    { borderRadius: radiuspin }
                                ]}
                            >
                                <MaterialIcons
                                    name="password"
                                    size={24}
                                    color="gray"
                                />
                                <Text style={styles.authButtonText}>PIN</Text>
                            </Animated.View>
                        </Pressable>

                        <Pressable
                            onPress={null}
                            onPressIn={() => {
                                Animated.timing(radiusfp, {
                                    toValue: 15,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onPressOut={() => {
                                Animated.timing(radiusfp, {
                                    toValue: 8,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                        >
                            <Animated.View
                                style={[
                                    styles.authButton,
                                    { borderRadius: radiusfp }
                                ]}
                            >
                                <Ionicons
                                    name="finger-print"
                                    size={24}
                                    color="gray"
                                />
                                <Text style={[styles.authButtonText, { textAlign: 'center' }]}>
                                    {`Fingerprint (Coming Soon)`}
                                </Text>
                            </Animated.View>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TwoFactScreen;