import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image, Linking } from 'react-native'
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const APP_NAME = 'Connect';
const APP_VERSION = 'v1.0.0';
const LAST_UPDATED = 'July 19, 2026';
const SUPPORT_EMAIL = 'develax2007@gmail.com'

const SECTIONS = [
	{
		icon: 'database-outline',
		lib: MaterialCommunityIcons,
		title: 'Information We Collect',
		body:
			`We collect information you provide directly, such as your name, email address, profile photo, and any content you post.`,
	},
	{
		icon: 'cog-outline',
		lib: MaterialCommunityIcons,
		title: 'How We Use Your Information',
		body:
			'Your information is used to operate and authenticate your account, provide customer support, send important service notifications, and improve the safety and performance of the app. We do not use your data to build advertising profiles.',
	},
	{
		icon: 'account-group-outline',
		lib: MaterialCommunityIcons,
		title: 'Sharing Your Information',
		body:
			'We do not sell your personal information. We may share limited data with trusted service providers who help us operate the app (such as hosting and analytics providers), or when required by law, to protect our rights, or to prevent fraud and abuse.',
	},
	{
		icon: 'lock-outline',
		lib: MaterialCommunityIcons,
		title: 'Data Security',
		body:
			'We use industry-standard safeguards, including encryption in transit and secure authentication, to protect your information. Your password and two factor authentication are encrypted for users safety.',
	},
	{
		icon: 'timer-sand',
		lib: MaterialCommunityIcons,
		title: 'Data Retention',
		body:
			'We retain your information for as long as your account is active or as needed to provide our services. If you delete your account, we will delete or anonymize your personal data.',
	},
	{
		icon: 'account-check-outline',
		lib: MaterialCommunityIcons,
		title: 'Your Rights & Choices',
		body:
			'You can access, update, or delete your personal information at any time from your account settings. Depending on your location, you may also have additional rights under applicable data protection laws, such as the right to request a copy of your data.',
	},
	{
		icon: 'account-child-outline',
		lib: MaterialCommunityIcons,
		title: "Children's Privacy",
		body:
			`${APP_NAME} is not intended for children under 18, and we do not knowingly collect personal information from children under 18. If we learn we have collected such information, we will delete it promptly.`,
	},
	{
		icon: 'refresh',
		lib: MaterialCommunityIcons,
		title: 'Changes to This Policy',
		body:
			'We may update this privacy policy from time to time. We will notify you of material changes through the app or by email, and continued use of the app after such changes constitutes acceptance of the updated policy.',
	},
];

const PrivacyScreen = () => {
	const navi = useNavigation();
	const { isDark, TEXT } = useTheme();

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
			marginBottom: 4,
		},
		rowBody: {
			fontFamily: 'Anaheim-Regular',
			fontSize: 13.5,
			lineHeight: 19,
			color: mutedcolor,
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

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navi.goBack()}>
					<Feather name="arrow-left" size={24} color={fontcolor} />
				</TouchableOpacity>
				<Text style={TEXT.heading}>Privacy Policy</Text>
			</View>

			<ScrollView style={{ width: '92%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

				{/* APP META */}
				<View style={styles.metaCard}>
					<View style={[styles.iconCircle, { width: 44, height: 44, borderRadius: 22, backgroundColor: accentSoft }]}>
						<Image source={require('../assets/images/connect.png')} style={{width: 50, height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#227a22'}} />
					</View>
					<View>
						<Text style={styles.metaTitle}>{APP_NAME}</Text>
						<Text style={styles.metaSub}>{APP_VERSION} · Last updated {LAST_UPDATED}</Text>
					</View>
				</View>

				{/* POLICY SECTIONS */}
				<Text style={styles.sectionLabel}>Our Commitment</Text>
				<View style={styles.card}>
					{SECTIONS.map((section, index) => {
						const Icon = section.lib;
						const isLast = index === SECTIONS.length - 1;
						return (
							<View key={section.title}>
								<View style={styles.row}>
									<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
										<Icon name={section.icon} size={18} color={accent} />
									</View>
									<View style={styles.rowTextContainer}>
										<Text style={styles.rowTitle}>{section.title}</Text>
										<Text style={styles.rowBody}>{section.body}</Text>
									</View>
								</View>
								{!isLast && <View style={styles.rowDivider} />}
							</View>
						);
					})}
				</View>

				{/* CONTACT */}
				<Text style={styles.sectionLabel}>Questions?</Text>
				<View style={styles.card}>
					<TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.row}>
						<View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
							<MaterialIcons name="email" size={18} color={accent} />
						</View>
						<View style={styles.rowTextContainer}>
							<Text style={styles.rowTitle}>Contact Support</Text>
							<Text style={styles.rowBody}>
								If you have any questions about this privacy policy or how your data is handled, reach out to us through the Help & Support section.
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				<Text style={styles.footerNote}>
					{APP_NAME} {APP_VERSION} · By using this app you agree to this Privacy Policy.
				</Text>

			</ScrollView>
		</SafeAreaView>
	)
}

export default PrivacyScreen;