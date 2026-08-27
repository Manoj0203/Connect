import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserData } from '../utils/UserCache';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { optimizeCloudinaryUrl } from '../utils/Cloudinary';
import { useTheme } from '../utils/Theme';

const FriendsListScreen = () => {
    const route = useRoute();
    const navi = useNavigation();
    const { friendsIds } = route.params || {};
    
    const { isDark, TEXT } = useTheme();
    
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    const bg = isDark ? '#121214' : '#F7F7FA';
    const fontcolor = isDark ? '#F4F4F6' : '#17171B';
    const mutedcolor = isDark ? '#9A9AA5' : '#75758A';
    const borderCol = isDark ? '#2E2E33' : '#E7E7ED';

    useEffect(() => {
        const fetchFriends = async () => {
            if (friendsIds && friendsIds.length > 0) {
                try {
                    const friendsData = await Promise.all(
                        friendsIds.map(async (id) => {
                            const data = await getUserData(id);
                            return { id, ...data };
                        })
                    );
                    setFriends(friendsData);
                } catch (error) {
                    console.log("Error fetching friends:", error);
                }
            }
            setLoading(false);
        };
        fetchFriends();
    }, [friendsIds]);

    const renderFriend = ({ item }) => (
        <TouchableOpacity 
            style={[styles.friendCard, { borderColor: borderCol }]} 
            onPress={() => {
                navi.navigate('OtherProfile', { uid: item.id });
            }}
        >
            <Image 
                source={{ uri: item.image ? optimizeCloudinaryUrl(item.image, 100) : 'https://res.cloudinary.com/dwlh6mtl2/image/upload/v1784486369/user_obpnk4.png' }} 
                style={styles.profilePic} 
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: fontcolor, fontFamily: 'Anaheim-Bold', fontSize: 16 }} numberOfLines={1}>
                    {item.fullname || 'Unknown'} {item.isVerified && <MaterialIcons name="verified" size={14} color={isDark ? '#06ec06' : '#00B341'} />}
                </Text>
                <Text style={{ color: mutedcolor, fontFamily: 'Anaheim-SemiBold', fontSize: 13 }}>
                    @{item.username}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navi.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={fontcolor} />
                </TouchableOpacity>
                <Text style={[TEXT.heading, { fontSize: 20,}]}>Friends</Text>
            </View>
            
            {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={fontcolor} />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={item => item.id}
                    renderItem={renderFriend}
                    contentContainerStyle={{ paddingHorizontal: '5%', paddingBottom: 5,}}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: mutedcolor, marginTop: 40 }}>No friends found.</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default FriendsListScreen;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    profilePic: {
        width: 46,
        height: 46,
        borderRadius: 10,
    }
});
