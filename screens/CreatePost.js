import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import { useRoute } from '@react-navigation/native';
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { useTheme } from '../utils/Theme';
import { updateDoc, doc, serverTimestamp, getDoc, setDoc, collection, increment } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import ImagePicker from 'react-native-image-crop-picker';
import { ActivityIndicator, Snackbar } from 'react-native-paper'

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreatePost = () => {

	const { isDark, TEXT } = useTheme();

	const bgcolor = isDark ? '#121214' : '#F7F7FA';
	const cardcolor = isDark ? '#1C1C1F' : '#FFFFFF';
	const bordercolor = isDark ? '#2E2E33' : '#E7E7ED';
	const fontcolor = isDark ? '#F4F4F6' : '#17171B';
	const placeholdercolor = isDark ? '#9A9AA5' : '#75758A';
	const accent = isDark ? '#06ec06' : '#00B341';

	const richTextRef = useRef();

	const [errorsnackvisible, setErrorSnackVisible] = useState(false);
	const [successsnackvisible, setSuccessSnackVisible] = useState(false);
	const [posting, setPosting] = useState(false);

	const route = useRoute();
	const editMode = route?.params?.editMode || false;
	const editPostId = route?.params?.post?.postID;
	
	const [text, setText] = useState(route?.params?.post?.content || '');
	const user = auth.currentUser;

	// IMAGE
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const [imageUri, setImageUri] = useState(route?.params?.post?.image ? { uri: route.params.post.image, existing: true, width: route.params.post.width, height: route.params.post.height } : null);

	const handlePost = async () => {
		if (!text) {
			setErrorSnackVisible(true);
			return;
		}

		try {
			setPosting(true)

			let data = null;

			if (editMode) {
				const updateData = { content: text };
				if (imageUri && !imageUri.existing) {
					// Upload new image
					const formData = new FormData();
					formData.append('file', { uri: imageUri.path, type: imageUri.mime, name: imageUri.filename || null });
					formData.append('upload_preset', 'upload_posts');
					const res = await fetch('https://api.cloudinary.com/v1_1/dwlh6mtl2/image/upload', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
					const data = await res.json();
					updateData.image = data?.secure_url;
					updateData.width = data?.width;
					updateData.height = data?.height;
				} else if (!imageUri) {
					updateData.image = null;
					updateData.width = null;
					updateData.height = null;
				}
				await updateDoc(doc(db, 'posts', editPostId), updateData);
			} else {
				let data = null;
				if (imageUri && !imageUri.existing) {
					const formData = new FormData();
					formData.append('file', { uri: imageUri.path, type: imageUri.mime, name: imageUri.filename || null });
					formData.append('upload_preset', 'upload_posts');
					const res = await fetch('https://api.cloudinary.com/v1_1/dwlh6mtl2/image/upload', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
					data = await res.json();
				}
				const newPostRef = doc(collection(db, "posts"));
				await setDoc(newPostRef, {
					userID: user.uid,
					postID: newPostRef.id,
					shareCount: 0,
					content: text,
					likes: 0,
					totcomments: 0,
					image: data?.secure_url ?? null,
					width: data?.width ?? null,
					height: data?.height ?? null,
					time: serverTimestamp(),
					likedby: {},
					comments: {}
				});
				await updateDoc(doc(db, 'users', user.uid), { post: increment(1) });
			}

			if (!editMode) {
				setText('');
				richTextRef.current?.setContentHTML('');
				setImageUri(null);
			}
			setSuccessSnackVisible(true);
		}
		catch (error) {
			console.log(error);
		}
		finally {
			setPosting(false);
		}
	}

	const handleImageSelection = async () => {
		try {
			const image = await ImagePicker.openPicker({
				compressImageQuality: 0.8,
				compressImageMaxHeight: 1200,
				compressImageMaxWidth: 1200,
				cropping: true,
				cropperCircleOverlay: false,
				freeStyleCropEnabled: true,
				cropperToolbarTitle: 'Image',
				mediaType: 'photo',
				multiple: false,
			});

			setImageUri(image);
		}
		catch (error) {
			console.log(error)
		}
	}

	const styles = StyleSheet.create({
		toolbar:
		{
			borderTopRightRadius: 16,
			borderTopLeftRadius: 16,
			backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
			borderBottomWidth: 1,
			borderBottomColor: bordercolor,
		},
		editor:
		{
			flex: 1,
			padding: 8,
			placeholderColor: placeholdercolor,
			backgroundColor: cardcolor,
			color: fontcolor,
		},
		containerStyle:
		{
			minHeight: 220,
			borderBottomLeftRadius: 16,
			borderBottomRightRadius: 16,
			borderWidth: 1,
			borderColor: bordercolor,
			borderTopWidth: 0,
			padding: 0,
			overflow: 'hidden',
		},
		editorCard: {
			borderRadius: 16,
			borderWidth: 1,
			borderColor: bordercolor,
			overflow: 'hidden',
		},
		imagePicker: {
			marginTop: 16,
			borderRadius: 16,
			borderWidth: 1,
			borderColor: bordercolor,
			backgroundColor: cardcolor,
			overflow: 'hidden',
		},
		imagePickerHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 14,
			paddingVertical: 12,
		},
		imagePreview:
		{
			minHeight: 120,
			height: 'auto',
			justifyContent: 'center',
			alignItems: 'center',
		},
		emptyImageBox: {
			minHeight: 120,
			alignItems: 'center',
			justifyContent: 'center',
			gap: 6,
			paddingBottom: 16,
		},
		header:
        {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: '4%',
			paddingTop: 0,
        },
		postBtn: {
			backgroundColor: accent,
			paddingHorizontal: 18,
			paddingVertical: 8,
			borderRadius: 12,
		}
	})

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: bgcolor, width: '100%' }}>

			{/* HEADER */}
			<View style={[styles.header, {marginBottom: 16}]}>
                <Text style={TEXT.heading}>{editMode ? 'Edit Post' : 'Create Post'}</Text>
				{
					posting ?
						<ActivityIndicator color={accent} />
						:
						<TouchableOpacity onPress={handlePost} style={styles.postBtn}>
							<Text style={{ color: '#000', fontFamily: 'Anaheim-Bold', fontSize: 15 }}>{editMode ? 'Update' : 'Post'}</Text>
						</TouchableOpacity>
				}
            </View>

			<View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
				<View style={{ width: '92%', flex: 1 }}>
					<ScrollView showsVerticalScrollIndicator={false}>
						<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
							style={[styles.editorCard, { minHeight: 260 }]}>
							<RichToolbar
								style={styles.toolbar}
								getEditor={() => richTextRef.current}
								actions={[
									actions.setItalic,
									actions.setUnderline,
									actions.insertBulletsList,
									actions.insertOrderedList,
									actions.insertLink,
								]}
								selectedIconTint={accent}
								iconTint={placeholdercolor}
							/>
							<RichEditor
								ref={richTextRef}
								placeholder="What's on your mind today?"
								initialContentHTML={text}
								onChange={desctext => setText(desctext)}
								containerStyle={styles.containerStyle}
								editorStyle={styles.editor} />
						</KeyboardAvoidingView>

						<View style={styles.imagePicker}>
							<TouchableOpacity onPress={handleImageSelection} style={styles.imagePickerHeader}>
								<Text style={[TEXT.imageSelectortxt, { margin: 0 }]}>Add a photo</Text>
								<FontAwesome name="picture-o" size={18} color={accent} />
							</TouchableOpacity>
							<View style={styles.imagePreview}>
								{
									imageUri ?
										<View style={{ width: '100%', position: 'relative' }}>
											<Image
												source={{ uri: imageUri.path || imageUri.uri }}
												style={{ width: '100%', height: (imageUri.height / imageUri.width) * (screenWidth * 0.9) }}
												resizeMode='cover' />
											<TouchableOpacity 
												style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(177, 0, 0, 0.6)', borderRadius: 8, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
												onPress={() => setImageUri(null)}
											>
												<Ionicons name="close" size={20} color="#ffffff" />
											</TouchableOpacity>
										</View>
										:
										<TouchableOpacity onPress={handleImageSelection} style={styles.emptyImageBox}>
											<Ionicons name="image-outline" size={26} color={placeholdercolor} />
											<Text style={{ color: placeholdercolor, fontFamily: "Anaheim-Regular", fontSize: 13 }}>No image selected</Text>
										</TouchableOpacity>
								}
							</View>
						</View>
						<View style={{ height: 30 }} />
					</ScrollView>
				</View>

			</View>

			{/* ERROR SNACK */}
			<Snackbar
				visible={errorsnackvisible}
				onDismiss={() => setErrorSnackVisible(false)}
				duration={1500}
				style={{ backgroundColor: '#F04452', borderRadius: 12 }}
			>
				Post can not be blank!
			</Snackbar>

			{/* SUCCESS SNACK */}
			<Snackbar
				visible={successsnackvisible}
				onDismiss={() => setSuccessSnackVisible(false)}
				duration={1500}
				wrapperStyle={{ position: 'absolute' }}
				style={{ backgroundColor: '#22C55E', borderRadius: 12 }}
			>
				Posted successfully!
			</Snackbar>
		</SafeAreaView>
	)
}

export default CreatePost