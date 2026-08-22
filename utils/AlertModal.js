import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal'

const AlertModal = ({ 
    visible, onClose, onConfirm, isDark, 
    title="Delete Post?", message="Are you sure you want to delete your post?", 
    btnText="Delete", singleButton=false, config 
}) => {

    const isVisible = config ? config.visible : visible;
    const modalTitle = config && config.title ? config.title : title;
    const modalMessage = config && config.message ? config.message : message;
    const isSingleButton = config ? config.singleButton : singleButton;
    const modalBtnText = config && config.btnText ? config.btnText : btnText;

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalBox: {
            width: '100%',
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
            backgroundColor: isSingleButton ? (isDark ? '#333' : '#e0e0e0') : '#FF2F32',
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 5,
            alignSelf:'center'
        },
    });

    return (
        <Modal
            isVisible={isVisible}
            hasBackdrop={true}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            animationIn={'fadeIn'}
            animationOut={'fadeOut'}
            useNativeDriver={true}
         >
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.title}>{modalTitle}</Text>

                    <Text style={{color:  isDark ? '#fff': '#000', fontFamily:'Anaheim-SemiBold'}}>{modalMessage}</Text>

                    <View style={styles.buttons}>
                        {!isSingleButton && (
                            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                                <Text style={{color:  isDark ? '#fff': '#000', fontFamily:'Anaheim-SemiBold'}}>Cancel</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={isSingleButton ? onClose : onConfirm} style={styles.deleteBtn}>
                            <Text style={{ color: isSingleButton ? (isDark ? '#fff' : '#000') : '#fff', fontFamily:'Anaheim-SemiBold' }}>{isSingleButton ? 'Okay' : modalBtnText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AlertModal;