import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/Theme';
import { Searchbar } from 'react-native-paper';
import { getDocs, doc, collection, query, where, } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import auth, { db } from '../services/firebaseAuth';

const SearchScreen = () => {

    const { Colour, isDark, TEXT, TEXTINPUT } = useTheme();

    const searchhistory = "SEARCH_HISTORY"

    // console.log(auth.currentUser.uid)

    const navi = useNavigation();

    const [searcheduser, setSearchedUser] = useState('');
    const [searcheduserarray, setSearchedUserArray] = useState([]);
    const [loading, setLoading] = useState(false);

    const styles = StyleSheet.create({
        container: {
            backgroundColor: isDark ? "#121214" : "#F7F7FA",
            flex: 1,
        },
        inputSearchtxt: {
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
        },
        header:
        {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: '5%'

        }
    });

    const handleOpenOtherUserID = (userid) => {
        navi.navigate('OtherProfile', { uid: userid });
    }

    const handledynamicsearch = async (search) => {
        setSearchedUser(search);

        setSearchedUserArray([]);
        if (search === '') {
            setSearchedUserArray([]);
            return;
        }

        let results = [];

        setLoading(true);

        try {
            const quer = query(collection(db, 'users'), where('uid', '!=', auth.currentUser.uid));
            const querySnapshot = await getDocs(quer);
            if (querySnapshot) {
                querySnapshot.forEach((docs) => {
                    const filtered = (docs.data().username).includes(search.toLowerCase());
                    if (filtered) {
                        results.push(docs.data());
                    }
                })
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            setLoading(false);
        }

        setSearchedUserArray(results);
        console.log(searcheduserarray);
    }

    const renderusers = ({ item, index }) => {
        return (
            <TouchableOpacity onPress={() => handleOpenOtherUserID(item?.uid)} style={{ backgroundColor: isDark ? '#15151581' : '#cecece', marginVertical: 5, height: 70, padding: 10, borderRadius: 8, flexDirection: 'row' }}>
                <View style={{}}>
                    <Image
                        source={{ uri: item?.image }}
                        style={{ height: 50, width: 50, borderRadius: 8, }} />
                </View>
                <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: isDark ? '#fff' : '#000' }}>{item?.username}</Text>
                    <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 15, color: isDark ? '#fff' : '#000' }}>{item?.fullname}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container} >
            <View style={styles.header}>
                {/* APP NAME */}
                <Text style={TEXT.heading}>Search</Text>
            </View>
            <Searchbar placeholder='Search Friends'
                placeholderTextColor={isDark ? '#b5b5b5dc' : '#7e7e7eff'}
                onChangeText={handledynamicsearch}
                value={searcheduser}
                inputStyle={[styles.inputSearchtxt, { marginTop: -8 }]}
                style={{ backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4', marginHorizontal: 10, marginTop: 10, height: 40, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#555e56' : '#E7E7ED' }} />

            <FlatList
                data={searcheduserarray}
                renderItem={renderusers}
                style={{ marginHorizontal: 15, marginVertical: 10, marginBottom: '15%' }}
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        {(!searcheduser) ?
                            <Text style={[TEXT.emptyTextContainer, { marginTop: '75%' }]}>Start Searching your friends</Text>
                            :
                            <Text style={[TEXT.emptyTextContainer, { marginTop: '75%' }]}>No user id found</Text>}
                    </View>
                )} />

        </SafeAreaView>
    )
}

export default SearchScreen;