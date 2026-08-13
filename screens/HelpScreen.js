import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Linking, Image } from 'react-native'
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const APP_NAME = 'Connect';
const APP_VERSION = 'v1.0.0';
const SUPPORT_EMAIL = 'develax2007@gmail.com';

const FAQS = [
    {
        icon: 'account-lock-outline',
        lib: MaterialCommunityIcons,
        question: 'How do I reset my password?',
        answer:
            "Go to Settings > Change security info, then choose 'Reset password'.",
    },
    {
        icon: 'two-factor-authentication',
        lib: MaterialCommunityIcons,
        question: 'How do I enable two-factor authentication?',
        answer:
            'Open Settings > 2 factor authentication and follow the prompts to link your authenticator app or phone number for an extra layer of security.',
    },
    // {
    //     icon: 'verified',
    //     lib: MaterialIcons,
    //     question: 'How do I get a verification badge?',
    //     answer:
    //         "Navigate to Settings > Get verification badge and submit the requested details. Our team typically reviews requests within a few business days.",
    // },
    {
        icon: 'account-remove-outline',
        lib: MaterialCommunityIcons,
        question: 'How do I delete my account?',
        answer:
            "Go to Settings > Delete account, confirm your email and password, and follow the on-screen steps. This action is permanent and removes your data.",
    },
    {
        icon: 'bell-outline',
        lib: MaterialCommunityIcons,
        question: "I'm not receiving notifications",
        answer:
            'Check that notifications are enabled for the app in your device settings, and that you have a stable internet connection. Restarting the app can also help.',
    },
    {
        icon: 'bug-outline',
        lib: MaterialCommunityIcons,
        question: 'How do I report a bug?',
        answer:
            'Use the Contact Support option below and describe what happened, including your device model and app version, so we can investigate quickly.',
    },
];

const HelpScreen = () => {
    const navi = useNavigation();
    const { isDark, TEXT } = useTheme();

    const [expanded, setExpanded] = useState(null);

    const bg = isDark ? '#121214' : '#F7F7FA';
    const cardBg = isDark ? '#1C1C1F' : '#FFFFFF';
    const border = isDark ? '#2E2E33' : '#E7E7ED';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
    const accent = isDark ? '#06ec06' : '#00B341';
    const accentSoft = isDark ? '#173620' : '#E6F9EC';

    const styles = StyleSheet.create({
        container: {
            backgroundColor: bg,
            flex: 1,
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '4%',
            paddingBottom: 10,
            gap: 15,
        },
        sectionLabel: {
            fontFamily: 'Anaheim-Bold',
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
            marginBottom: 24,
            overflow: 'hidden',
        },
        row: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: 14,
            paddingHorizontal: 14,
            gap: 12,
        },
        rowDivider: {
            height: 1,
            backgroundColor: border,
            marginLeft: 58,
        },
        iconCircle: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rowTextContainer: {
            flex: 1,
        },
        rowTitle: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 15,
            color: fontcolor,
        },
        rowAnswer: {
            fontFamily: 'Anaheim-Regular',
            fontSize: 13.5,
            lineHeight: 19,
            color: mutedcolor,
            marginTop: 8,
        },
        questionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        metaCard: {
            backgroundColor: cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            padding: 16,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        metaTitle: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 15,
            color: fontcolor,
        },
        metaSub: {
            fontFamily: 'Anaheim-Regular',
            fontSize: 12.5,
            color: mutedcolor,
            marginTop: 2,
        },
        footerNote: {
            fontFamily: 'Anaheim-Regular',
            fontSize: 12,
            color: mutedcolor,
            textAlign: 'center',
            marginBottom: 30,
            marginTop: 4,
        },
    })

    const toggleFAQ = (index) => {
        setExpanded(expanded === index ? null : index);
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={fontcolor} />
                </TouchableOpacity>
                <Text style={TEXT.heading}>Help & Support</Text>
            </View>

            <ScrollView style={{ width: '92%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

                {/* APP META */}
                <View style={styles.metaCard}>
                    <View style={[styles.iconCircle, { width: 44, height: 44, borderRadius: 22, backgroundColor: accentSoft }]}>
                        <Image source={require('../assets/images/connect.png')} style={{ width: 50, height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#227a22' }} />
                    </View>
                    <View>
                        <Text style={styles.metaTitle}>{APP_NAME}</Text>
                        <Text style={styles.metaSub}>{APP_VERSION} · We're here to help</Text>
                    </View>
                </View>

                {/* FAQ */}
                <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
                <View style={styles.card}>
                    {FAQS.map((faq, index) => {
                        const Icon = faq.lib;
                        const isLast = index === FAQS.length - 1;
                        const isOpen = expanded === index;
                        return (
                            <View key={faq.question}>
                                <TouchableOpacity onPress={() => toggleFAQ(index)} style={styles.row}>
                                    <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
                                        <Icon name={faq.icon} size={18} color={accent} />
                                    </View>
                                    <View style={styles.rowTextContainer}>
                                        <View style={styles.questionRow}>
                                            <Text style={styles.rowTitle}>{faq.question}</Text>
                                            <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={mutedcolor} />
                                        </View>
                                        {isOpen && <Text style={styles.rowAnswer}>{faq.answer}</Text>}
                                    </View>
                                </TouchableOpacity>
                                {!isLast && <View style={styles.rowDivider} />}
                            </View>
                        );
                    })}
                </View>

                {/* CONTACT */}
                <Text style={styles.sectionLabel}>Still Need Help?</Text>
                <View style={styles.card}>
                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.row}>
                        <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
                            <MaterialIcons name="email" size={18} color={accent} />
                        </View>
                        <View style={styles.rowTextContainer}>
                            <Text style={styles.rowTitle}>Contact Support</Text>
                            <Text style={styles.rowAnswer}>Email us at {SUPPORT_EMAIL} and we'll get back to you as soon as possible.</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.rowDivider} />
                    <TouchableOpacity onPress={() => navi.navigate('Privacy')} style={styles.row}>
                        <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
                            <MaterialCommunityIcons name="file-document-outline" size={18} color={accent} />
                        </View>
                        <View style={styles.rowTextContainer}>
                            <Text style={styles.rowTitle}>Privacy Policy</Text>
                            <Text style={styles.rowAnswer}>Review how we collect, use, and protect your information.</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerNote}>
                    {APP_NAME} {APP_VERSION}
                </Text>

            </ScrollView>
        </SafeAreaView>
    )
}

export default HelpScreen;