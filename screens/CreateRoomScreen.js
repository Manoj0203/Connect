import AlertModal from '../utils/AlertModal';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '../services/firebaseAuth';
import { ActivityIndicator } from 'react-native-paper';

export default function CreateRoomScreen() {
    const navigation = useNavigation();
    const curruser = auth.currentUser;
    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();

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

    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = "https://connect-backend-hazel.vercel.app/"; // Should ideally use env config

    const handleCreateRoom = async () => {
        if (!name.trim() || !password.trim()) {
            showAlert("Error", "Name and Password are required");
            return;
        }

        setLoading(true);
        try {
            const token = await curruser.getIdToken();
            const response = await fetch(`${BACKEND_URL}createRoom`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    desc: desc.trim(),
                    password: password.trim(),
                    groupPic: null // Add image picker logic later if needed
                })
            });

            const result = await response.json();
            if (result.success) {
                showAlert("Success", "Room created successfully!");
                navigation.goBack();
            } else {
                showAlert("Error", result.message || "Failed to create room");
            }
        } catch (error) {
            console.log(error);
            showAlert("Error", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colour.bg.backgroundColor,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '5%',
            paddingBottom: 15,
        },
        backBtn: {
            marginRight: SPACING.md,
        },
        scrollContent: {
            padding: '5%',
        },
        inputWrap: {
            marginBottom: SPACING.lg,
        },
        inputLabel: {
            color: Colour.textSecondary,
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 13,
            marginBottom: 6,
            marginLeft: 4,
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colour.card.backgroundColor,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: Colour.border,
            paddingHorizontal: SPACING.md,
            minHeight: 50,
        },
        inputIcon: {
            marginRight: SPACING.sm,
        },
        textInput: {
            flex: 1,
            color: Colour.textPrimary,
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 15,
        },
        createBtn: {
            backgroundColor: Colour.accent,
            borderRadius: RADIUS.md,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: SPACING.lg,
            shadowColor: Colour.accent,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },
        createBtnText: {
            color: isDark? '#000': '#fff',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colour.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[TEXT.heading, { color: Colour.textPrimary }]}>Create Room</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>Room Name</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="people" size={20} color={Colour.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter room name"
                                placeholderTextColor={Colour.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>Description (Optional)</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="document-text" size={20} color={Colour.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="What is this room about?"
                                placeholderTextColor={Colour.textSecondary}
                                value={desc}
                                onChangeText={setDesc}
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>Room Password</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed" size={20} color={Colour.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Secret password"
                                placeholderTextColor={Colour.textSecondary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colour.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={handleCreateRoom}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.createBtnText}>Create Room</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        
            <AlertModal 
                config={alertConfig} 
                onClose={hideAlert} 
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }} 
                isDark={isDark} 
            />
        </SafeAreaView>
    );
}



