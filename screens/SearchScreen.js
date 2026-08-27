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

    const { Colour, isDark, TEXT, SPACING, RADIUS } = useTheme();

    const curruser = auth.currentUser;
    const searchhistory = `SEARCH_HISTORY_${curruser ? curruser.uid : 'guest'}`;

    const navi = useNavigation();

    const [searcheduser, setSearchedUser] = useState('');
    const [searcheduserarray, setSearchedUserArray] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const loadRecentSearches = async () => {
            try {
                const stored = await AsyncStorage.getItem(searchhistory);
                if (stored) {
                    setRecentSearches(JSON.parse(stored));
                }
            } catch (error) {
                console.log(error);
            }
        };
        loadRecentSearches();
    }, []);

    const saveRecentSearches = async (newRecentSearches) => {
        setRecentSearches(newRecentSearches);
        try {
            await AsyncStorage.setItem(searchhistory, JSON.stringify(newRecentSearches));
        } catch (error) {
            console.log(error);
        }
    };

    const styles = StyleSheet.create({
        container: {
            backgroundColor: isDark ? "#121214" : "#F7F7FA",
            flex: 1,
        },
        inputSearchtxt: {
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: '5%'
        },
        usercard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            marginBottom: SPACING.md,
            backgroundColor: Colour.card.backgroundColor,
            borderColor: Colour.border
        },
        clearAllText: {
            color: isDark ? '#cdcdcd' : '#000000',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 14,
        }
    });

    const handleOpenOtherUserID = (item) => {
        // Save to recent searches
        let updatedSearches = recentSearches.filter(user => user.uid !== item.uid);
        updatedSearches.unshift(item); // Add to top
        if (updatedSearches.length > 20) {
            updatedSearches = updatedSearches.slice(0, 20); // Keep max 20
        }
        saveRecentSearches(updatedSearches);

        navi.navigate('OtherProfile', { uid: item.uid });
    }

    const handleRemoveRecent = (uid) => {
        const updatedSearches = recentSearches.filter(user => user.uid !== uid);
        saveRecentSearches(updatedSearches);
    }

    const handleClearAll = () => {
        saveRecentSearches([]);
    }

    const handledynamicsearch = async (search) => {
        setSearchedUser(search);

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
    }

    const renderusers = ({ item }) => {
        const isRecent = searcheduser === '';
        return (
            <TouchableOpacity onPress={() => handleOpenOtherUserID(item)} style={styles.usercard}>
                <View>
                    <Image
                        source={{ uri: item?.image }}
                        style={{ height: 50, width: 50, borderRadius: 8, }} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 15, color: isDark ? '#fff' : '#000' }}>{item?.username}</Text>
                    <Text style={{ fontFamily: 'Anaheim-Regular', fontSize: 15, color: isDark ? '#fff' : '#000' }}>{item?.fullname}</Text>
                </View>
                {isRecent && (
                    <TouchableOpacity onPress={() => handleRemoveRecent(item?.uid)} style={{ padding: 8 }}>
                        <Text style={{ color: isDark ? '#9A9AA5' : '#75758A', fontSize: 20, fontFamily: 'Anaheim-Bold' }}>×</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        )
    }

    const renderListHeader = () => {
        if (searcheduser === '' && recentSearches.length > 0) {
            return (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontFamily: 'Anaheim-Bold', fontSize: 16, color: isDark ? '#F4F4F6' : '#17171B' }}>Recent</Text>
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    }

    return (
        <SafeAreaView style={styles.container} >
            <View style={styles.header}>
                <Text style={TEXT.heading}>Search</Text>
            </View>
            <Searchbar placeholder='Search Friends'
                placeholderTextColor={isDark ? '#b5b5b5dc' : '#7e7e7eff'}
                onChangeText={handledynamicsearch}
                value={searcheduser}
                inputStyle={[styles.inputSearchtxt, { marginTop: -8 }]}
                style={{ backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4', marginHorizontal: 10, marginTop: 10, height: 40, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#555e56' : '#E7E7ED' }} />

            <FlatList
                data={searcheduser === '' ? recentSearches : searcheduserarray}
                renderItem={renderusers}
                ListHeaderComponent={renderListHeader}
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