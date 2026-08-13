import { Pressable, StyleSheet, Text, TouchableOpacity, View, Animated, Linking } from "react-native";
import React, { useCallback, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Switch } from "react-native-paper";
import Modal from "react-native-modal";
import { BlurView } from "@react-native-community/blur";

import { useTheme } from "../utils/Theme";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

import auth, { db } from "../services/firebaseAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, doc } from "firebase/firestore";

const TwoFactScreen = () => {
    const { isDark, TEXT } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    // Same derived palette used across ProfileScreen / SettingsScreen / SecurityInfoScreen
    const bg = isDark ? "#121214" : "#F7F7FA";
    const cardBg = isDark ? "#1C1C1F" : "#FFFFFF";
    const border = isDark ? "#2E2E33" : "#E7E7ED";
    const fontcolor = isDark ? "#F4F4F6" : "#17171B";
    const mutedcolor = isDark ? "#9A9AA5" : "#75758A";
    const accent = isDark ? "#06ec06" : "#00B341";
    const accentSoft = isDark ? "#173620" : "#E6F9EC";

    const [isSwitchOn, setIsSwitchOn] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [typeused, setTypeUsed] = useState('')
    const [showchangeauth, setShowChangeAuth] = useState('');

    const radiuspin = useRef(new Animated.Value(14)).current;
    const radiusfp = useRef(new Animated.Value(14)).current;

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
        container: {
            backgroundColor: bg,
            flex: 1,
        },
        header: {
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: "4%",
            paddingBottom: 10,
            gap: 15
        },
        sectionLabel: {
            fontFamily: "Anaheim-Bold",
            fontSize: 15,
            color: fontcolor,
            marginHorizontal: 4,
            marginBottom: 10,
        },
        card: {
            backgroundColor: cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            overflow: "hidden",
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 14,
            gap: 12,
        },
        iconCircle: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
        },
        rowText: {
            flex: 1,
            fontFamily: "Anaheim-SemiBold",
            fontSize: 15,
            color: fontcolor,
        },
        infoCard: {
            width: "92%",
            alignSelf: "center",
            marginTop: 16,
            backgroundColor: cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            padding: 16,
            gap: 10,
        },
        authButton: {
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: border,
            backgroundColor: isDark ? "#232326" : "#F3F3F7",
            borderRadius: 16,
            width: 110,
            height: 130
        },
        authButtonText: {
            color: fontcolor,
            fontFamily: "Anaheim-SemiBold",
            fontSize: 13,
            marginTop: 10,
            textAlign: 'center',
            paddingHorizontal: 6,
        },
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
        const email = 'develax2007@gmail.com';

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
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={fontcolor} />
                </TouchableOpacity>
                <Text style={TEXT.heading}>Authentication</Text>
            </View>

            <View style={{ width: "92%", alignSelf: "center" }}>
                <Text style={styles.sectionLabel}>Two factor authentication</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
                            <MaterialIcons name="password" size={18} color={accent} />
                        </View>
                        <Text style={styles.rowText}>Turn on</Text>
                        <Switch
                            value={isSwitchOn}
                            onValueChange={onToggleSwitch}
                            color={accent}
                        />
                    </View>
                </View>
            </View>

            {isSwitchOn && (
                <>
                    <View style={styles.infoCard}>
                        <Text style={{ fontFamily: 'Anaheim-SemiBold', color: fontcolor, fontSize: 15 }}>
                            Authentication type used:{' '}
                            <Text style={{ fontFamily: 'Anaheim-Bold', color: accent, fontSize: 16 }}>
                                {typeused.toUpperCase()}
                            </Text>
                        </Text>

                        {typeused == 'pin' ?
                            <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Text style={{ fontFamily: 'Anaheim-SemiBold', color: mutedcolor, fontSize: 14 }}>
                                    Forgot your two-factor code?
                                </Text>
                                <TouchableOpacity onPress={() => setShowChangeAuth(!showchangeauth)}>
                                    <Text style={{ fontFamily: 'Anaheim-Bold', color: accent, fontSize: 14 }}>
                                        Click here
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null}
                    </View>

                    {
                        showchangeauth && (
                            <>
                                <View style={styles.infoCard}>
                                    <Text style={{ fontFamily: 'Anaheim-SemiBold', color: mutedcolor, fontSize: 14 }}>
                                        To Team Develax
                                    </Text>
                                    <Text style={{ fontFamily: 'Anaheim-SemiBold', color: fontcolor, fontSize: 14, lineHeight: 20 }}>
                                        {`I am unable to access my account because I have forgotten my Two-Factor Authentication (2FA) PIN/code. I would like to request a reset or change of my 2FA settings so that I can regain access to my account.${'\n\n'}Thank you for your assistance. I look forward to your response.${'\n\n'}Best regards`}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'center', marginTop: 14 }}>
                                    <TouchableOpacity
                                        onPress={openEmail}
                                        style={{ borderWidth: 1.5, borderColor: accent, paddingVertical: 10, width: '55%', borderRadius: 12, alignItems: 'center' }}>
                                        <Text style={{ color: accent, fontSize: 15, fontFamily: 'Anaheim-Bold' }}>Send Mail</Text>
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
                backdropOpacity={1}
                customBackdrop={
                    <BlurView style={{ flex: 1 }} blurType={isDark ? "dark" : "light"} blurAmount={5} reducedTransparencyFallbackColor="white" />
                }
                onBackButtonPress={() => setShowMethodModal(false)}
                onBackdropPress={() => setShowMethodModal(false)}
                style={{
                    justifyContent: "flex-end",
                    margin: 0,
                }}
            >
                <View
                    style={{
                        backgroundColor: cardBg,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderWidth: 1,
                        borderColor: border,
                        paddingBottom: 28,
                        paddingTop: 8,
                    }}
                >
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: border, alignSelf: 'center', marginVertical: 10 }} />
                    <Text style={[TEXT.subheading, { paddingHorizontal: 4 }]}>
                        Authentication Method
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignSelf: "center",
                            gap: 20,
                            marginTop: 16,
                        }}
                    >
                        <Pressable
                            onPressIn={() => {
                                Animated.timing(radiuspin, {
                                    toValue: 22,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onPressOut={() => {
                                Animated.timing(radiuspin, {
                                    toValue: 14,
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
                                <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
                                    <MaterialIcons name="password" size={20} color={accent} />
                                </View>
                                <Text style={styles.authButtonText}>PIN</Text>
                            </Animated.View>
                        </Pressable>

                        <Pressable
                            onPress={null}
                            onPressIn={() => {
                                Animated.timing(radiusfp, {
                                    toValue: 22,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onPressOut={() => {
                                Animated.timing(radiusfp, {
                                    toValue: 14,
                                    duration: 150,
                                    useNativeDriver: false
                                }).start();
                            }}
                        >
                            <Animated.View
                                style={[
                                    styles.authButton,
                                    { borderRadius: radiusfp, opacity: 0.6 }
                                ]}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#26262b' : '#eaeaef' }]}>
                                    <Ionicons name="finger-print" size={20} color={mutedcolor} />
                                </View>
                                <Text style={styles.authButtonText}>
                                    {`Fingerprint\n(Coming Soon)`}
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