import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image } from 'react-native'
import React, { useRef, useState } from 'react'
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/Theme';
import { updateDoc, doc, addDoc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import auth, { db } from '../services/firebaseAuth';
import ImagePicker from 'react-native-image-crop-picker';
import { ActivityIndicator, Snackbar } from 'react-native-paper'


import FontAwesome from 'react-native-vector-icons/FontAwesome';

const CreatePost = () => {

	const { Colour, isDark, TEXT } = useTheme();

	const bgcolor = isDark ? '#252525' : '#f6f6f6';
	const fontcolor = isDark ? '#fff' : '#000';
	const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'

	const richTextRef = useRef();
	const [text, setText] = useState('');

	const [errorsnackvisible, setErrorSnackVisible] = useState(false);
	const [successsnackvisible, setSuccessSnackVisible] = useState(false);
	const [posting, setPosting] = useState(false);

	const user = auth.currentUser;

	// IMAGE
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const [imageUri, setImageUri] = useState(null);

	const handlePost = async () => {
		if (!text) {
			setErrorSnackVisible(true);
			return;
		}

		try {
			setPosting(true)

			let data = null;

			if (imageUri) {
				const formData = new FormData();
				formData.append('file', {
					uri: imageUri.path,
					type: imageUri.mime,
					name: imageUri.filename || null,
				});

				formData.append('upload_preset', 'upload_posts');

				const res = await fetch(
					'https://api.cloudinary.com/v1_1/dwlh6mtl2/image/upload',
					{
						method: 'POST',
						body: formData,
						headers: {
							'Content-Type': 'multipart/form-data',
						},
					}
				);

				data = await res.json();
			}

			const newPostRef = doc(collection(db, "posts"));
			const postId = newPostRef.id;

			await setDoc(newPostRef, {
				userID: user.uid,
				postID: null,
				shareCount: 0,
				content: text,
				likes: 0,
				totcomments: 0,
				image: data?.secure_url ?? null,
				width: data?.width ?? null,
				height: data?.height ?? null,
				time: serverTimestamp(),
				postID: postId,
				likedby: {},
				comments: {}
			});

			const userDocSnap = await getDoc(doc(db, 'users', user.uid));
			if (userDocSnap.exists()) {
				const post = (userDocSnap.data().post || 0) + 1
				await updateDoc(doc(db, 'users', user.uid), { post })
			}
			setText('');

			richTextRef.current.setContentHTML('')
			setImageUri(null)
			setSuccessSnackVisible(true);
			setImageUri(null);
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
			borderTopRightRadius: 8,
			borderTopLeftRadius: 8,
			backgroundColor: placeholdercolor,
		},
		editor:
		{
			flex: 1,
			borderWidth: 2,
			borderBottomLeftRadius: 8,
			borderBottomRightRadius: 8,
			borderColor: placeholdercolor,
			padding: 5,
			placeholderColor: placeholdercolor,
			backgroundColor: isDark ? "#252525" : "#fff",
			color: fontcolor,
		},
		containerStyle:
		{
			borderWidth: 2,
			minHeight: 240,
			borderBottomLeftRadius: 8,
			borderBottomRightRadius: 8,
			borderColor: placeholdercolor,
			padding: 5,
		},
		imagePreview:
		{
			minHeight: 100,
			height: 'auto',
			borderWidth: 2,
			borderColor: placeholdercolor,
			borderBottomLeftRadius: 8,
			borderBottomRightRadius: 8,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: 15,
		},
		header:
        {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: '5%'

        }
	})

	return (
		<View style={{ flex: 1, backgroundColor: bgcolor, width: '100%', padding: 0, alignItems: 'flex-start', }}>

			{/* HEADER */}
			<View style={[styles.header, {marginBottom:'3%'}]}>
                <Text style={TEXT.heading}>Create Post</Text>
				{
					posting ?
						<ActivityIndicator color={isDark ? "#06ec06ff" : '#00cc00ff'} />
						:
						<TouchableOpacity onPress={handlePost}>
							<Text style={[TEXT.usernametxt, { color: isDark ? "#06ec06ff" : '#00cc00ff' }]}>Post</Text>
						</TouchableOpacity>
				}
            </View>

			<View style={{ width: '100%', height: '100%', alignItems: 'center', }}>
				{/* CONTENT */}
				<View style={{ height: '91%', width: '90%', }}>

					<ScrollView>
						<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
							style={{ flex: 1, minHeight: 280, }}>
							<RichToolbar
								style={styles.toolbar}
								getEditor={() => richTextRef.current}
								actions={[
									actions.setBold,
									actions.setItalic,
									actions.setUnderline,
									actions.insertBulletsList,
									actions.insertOrderedList,
									// actions.alignLeft,
									// actions.alignCenter,
									// actions.alignRight,
									actions.insertLink,
									actions.heading1,
								]}
								selectedIconTint={isDark ? '#57ff57' : '#00ff00ff'}
								iconTint={isDark ? '#252525' : '#ffffffff'}
							/>
							<RichEditor
								ref={richTextRef}
								placeholder="What's in your mind today?"
								initialContentHTML={text}
								onChange={desctext => setText(desctext)}
								containerStyle={styles.containerStyle}
								editorStyle={styles.editor} />
						</KeyboardAvoidingView>

						<View style={{ backgroundColor: placeholdercolor, marginTop: 15, borderTopLeftRadius: 8, borderTopRightRadius: 8, }}>
							<TouchableOpacity onPress={handleImageSelection} style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={[TEXT.imageSelectortxt, { marginRight: 10, }]}>Pick a image</Text>
								<FontAwesome name="picture-o" size={20} color={isDark ? "#000" : "#fff"} style={{ marginTop: 5 }} />
							</TouchableOpacity>
						</View>
						<View style={styles.imagePreview}>
							{
								imageUri ?
									<Image
										source={{ uri: imageUri.path }}
										style={{ width: '100%', height: (imageUri.height / imageUri.width) * screenWidth, alignSelf: 'center', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, }}
										resizeMode='cover' />
									:
									<TouchableOpacity onPress={handleImageSelection}>
										<Text style={[TEXT.imageSelectortxt, { color: isDark ? '#fff' : '#000', fontFamily: "Anaheim-Regular", }]}>No image selected</Text>
									</TouchableOpacity>
							}
						</View>
					</ScrollView>
				</View>

			</View>

			{/* ERROR SNACK */}
			<Snackbar
				visible={errorsnackvisible}
				onDismiss={() => setErrorSnackVisible(false)}
				onclick={() => setErrorSnackVisible(false)}
				duration={1500}
				sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}
			>
				Post can not be blank!
			</Snackbar>

			{/* SUCCESS SNACK */}
			<Snackbar
				visible={successsnackvisible}
				onDismiss={() => setSuccessSnackVisible(false)}
				onclick={() => setSuccessSnackVisible(false)}
				duration={1500}
				wrapperStyle={{ position: 'absolute' }}
				sidebg={{ backgroundColor: isDark ? 'rgba(86, 255, 71, 1)' : 'rgba(0, 192, 0, 1)' }}
			>
				Posted successfully!
			</Snackbar>
		</View>
	)
}

export default CreatePost