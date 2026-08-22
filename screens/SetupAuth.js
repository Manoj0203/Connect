import React, { useState } from "react";
import {
    Text, View, TouchableOpacity, useColorScheme, ActivityIndicator
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Snackbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";

import PinButton from "../utils/PinButton";
import { useTheme } from "../utils/Theme";
import auth, { db } from "../services/firebaseAuth";
import { updateDoc } from "firebase/firestore";

export default function SetupAuth() {
    const { TEXT } = useTheme();

    const isDark = useColorScheme() === "dark";

    const navigation = useNavigation();

    const route = useRoute();

    const onSuccess = route.params?.onSuccess;
    const onFail = route.params?.onFail;
    const mode = route.params?.mode || "setup";
    const action = route.params?.action || "enable";

    const user = auth.currentUser;

    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [falseLength, setFalseLength] = useState(false);
    const [snackbar, setSnackbar] = useState(false);

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/";

    const handleSave = async () => {
        if (!/^\d{4}$/.test(pin)) {
            setSnackbar(true);
            return;
        }

        try {
            setLoading(true);

            const token = await auth.currentUser.getIdToken();

            const response = await fetch(`${BACKEND_URL}set2FA`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ pin })
            });

            const data = await response.json();

            if (data.success) {
                await AsyncStorage.setItem(
                    "twoFAtype",
                    JSON.stringify({
                        twoFA: true,
                        auth: "pin"
                    })
                );

                onSuccess?.();
                navigation.goBack();
            } else {
                onFail?.();
            }
        } catch (error) {
            console.log("handleSave error:", error);
            onFail?.();
        } finally {
            setLoading(false);
        }
    };

    const verifyPin = async () => {
        try {
            setLoading(true);

            if (!/^\d{4}$/.test(pin)) {
                setSnackbar(true);
                return;
            }
            const token = await auth.currentUser.getIdToken();

            const response = await fetch(`${BACKEND_URL}verify2FA`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ pin })
            });

            const data = await response.json();

            if (data.success) {
                // AsyncStorage is handled by onSuccess callback in TwoFactScreen
                // No need to write here again to avoid double write
                onSuccess?.();
                navigation.goBack();
            } else {
                onFail?.();
                setFalseLength(true);
            }
        } catch (error) {
            console.log("verifyPin error:", error.message); // ✅ .message so it prints properly
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SafeAreaView
                style={{
                    backgroundColor: isDark ? "#252525" : "#f6f6f6"
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginHorizontal: 15
                    }}
                >
                    <Text style={TEXT.heading}>
                        {mode === "setup" ? "Create PIN" : "Verify PIN"}
                    </Text>

                    {
                        loading ?
                            <ActivityIndicator size={'large'} color={isDark ? "#06ec06ff" : '#00cc00ff'} />

                            :
                            <TouchableOpacity
                                disabled={loading}
                                onPress={mode === "setup" ? handleSave : verifyPin}
                            >
                                <Text style={[TEXT.moto, { fontSize: 20 }]}>
                                    {mode === "setup" ? "Save" : "Verify"}
                                </Text>
                            </TouchableOpacity>
                    }
                </View>
            </SafeAreaView>

            <PinButton pin={pin} setPin={setPin} />

            <Snackbar
                visible={snackbar}
                duration={1500}
                sidebg={{backgroundColor: 'rgba(255, 71, 71, 1)'}}
                onDismiss={() => setSnackbar(false)}
            >
                PIN must be exactly 4 digits
            </Snackbar>

            <Snackbar
                visible={falseLength}
                duration={1500}
                sidebg={{backgroundColor: 'rgba(255, 71, 71, 1)'}}
                onDismiss={() => setFalseLength(false)}
            >
                Incorrect PIN. Please try again.
            </Snackbar>
        </>
    );
}