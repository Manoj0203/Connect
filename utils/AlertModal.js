import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal'

const AlertModal = ({ visible, onClose, onConfirm, isDark }) => {

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalBox: {
            width: '80%',
            backgroundColor: isDark ? '#252525': '#fff',
            padding: 20,
            borderRadius: 10,
        },
        title: {
            fontSize: 20,
            marginBottom: 10,
            color: isDark ? '#fff': '#000',
            fontFamily:'Anaheim-Bold'
        },
        buttons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20,
        },
        cancelBtn: {
            marginRight: 10,
            padding: 10,
        },
        deleteBtn: {
            backgroundColor: '#FF2F32',
            paddingHorizontal: 10,
            paddingVertical:5,
            borderRadius: 5,
            alignSelf:'center'
        },
    });

    return (
        <Modal
            isVisible={visible}
            hasBackdrop={true}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            animationIn={'fadeIn'}
            animationOut={'fadeOut'}
         >
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.title}>Delete Post?</Text>

                    <Text style={{color:  isDark ? '#fff': '#000', fontFamily:'Anaheim-SemiBold'}}>Are you sure you want to delete your post?</Text>

                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={{color:  isDark ? '#fff': '#000', fontFamily:'Anaheim-SemiBold'}}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onConfirm} style={styles.deleteBtn}>
                            <Text style={{ color: '#fff', fontFamily:'Anaheim-SemiBold' }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AlertModal;