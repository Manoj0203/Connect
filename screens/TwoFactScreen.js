import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, {useEffect, useState} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { Divider, Switch } from 'react-native-paper';

import { useTheme } from '../utils/Theme'
import Feather from 'react-native-vector-icons/Feather'
import Entypo from 'react-native-vector-icons/Entypo'

import auth, {db} from '../services/firebaseAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const TwoFactScreen = () => {

    const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    const buttoncard = isDark?'#5c5c5cff':'#d5d5d5ff';

    const [isSwitchOn, setIsSwitchOn] = useState(false);

    useEffect(() =>
    {
        const getSwitchState = async() =>
        {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            setIsSwitchOn(docSnap.data().authentication);
        }
        getSwitchState();
    },[]);

    const styles = StyleSheet.create({
        header:
		{
			width:'100%',
			flexDirection:'row',
			alignItems:'center',
			paddingHorizontal:'3%',
			gap:15
		},
    });

    const onToggleSwitch = async () =>
    {
        setIsSwitchOn(!isSwitchOn);
        await updateDoc(doc(db, 'users', user.uid),{
            authentication: !isSwitchOn,
        });
    }
            

  return (
    <SafeAreaView style={{backgroundColor:isDark?'#252525':'#fff', flex:1,}}>
        {/* HEADER */}
        <View style={styles.header}>
            {/* APP NAME */}
            <TouchableOpacity onPress={() => navi.goBack()}>
                <Feather name="arrow-left" size={24} color={isDark?"#fff":'#000'} />
            </TouchableOpacity>
            <Text style={[TEXT.heading,]}>Authentication</Text>
        </View>

        <View style={{width:'95%',alignSelf:'center',}}>
                {/* Authentication */}
				<View id='Authentication' style={{}}>
					<Text style={[TEXT.subheading, {fontSize:19}]}> Two factor Authentication</Text>
					<View style={{backgroundColor:buttoncard, width:'95%', padding:5, alignSelf:'center', marginLeft:-10, borderRadius:8, paddingVertical:8}}>
						{/* Change Email */}
						<TouchableOpacity onPress={onToggleSwitch} style={{flexDirection:'row', justifyContent:'space-between', width:'95%', alignItems:'center', alignSelf:'center'}}>
							<Text style={[BUTTON.settingbtntxt, {}]}>Turn On</Text>
                            <Switch value={isSwitchOn} onValueChange={onToggleSwitch} color={isDark ? "#06ec06ff" : '#00cc00ff'} />
							{/* <AntDesign name="right" size={18} color="black" /> */}
						</TouchableOpacity>
						{/* <Divider style={{width:'75%',}} /> */}
					</View>
				</View>
            </View>
            {
                isSwitchOn &&
                (
                    <View style={{width:'95%', alignSelf:'center', marginTop:20, flexDirection:'row', alignItems:'center', gap:10,}}>
                        <Entypo name="info-with-circle" size={16} color="gray" />
                        <Text style={{color:'gray', marginTop:5, fontFamily: "Anaheim-Regular", fontSize:14, width:'95%'}}>
                            The two factor authentication is enabled. The OTP sent in gmail will be required during login on new devices. Only one OTP will generated per day.
                        </Text>
                    </View>
                )
            }
    </SafeAreaView>
  )
}

export default TwoFactScreen