const fs = require('fs');
const path = require('path');

const files = [
    'M:/RN_Proj/Connect/screens/AuthScreen.js',
    'M:/RN_Proj/Connect/screens/CreateRoomScreen.js',
    'M:/RN_Proj/Connect/screens/EditScreen.js',
    'M:/RN_Proj/Connect/screens/LoginScreen.js',
    'M:/RN_Proj/Connect/screens/OtherProfile.js',
    'M:/RN_Proj/Connect/screens/RoomAboutScreen.js',
    'M:/RN_Proj/Connect/screens/RoomDetailScreen.js',
    'M:/RN_Proj/Connect/screens/signupstack/SettingUp.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add import AlertModal
    if (!content.includes('import AlertModal')) {
        let importPath = file.includes('signupstack') ? '../../utils/AlertModal' : '../utils/AlertModal';
        content = content.replace(/import React/, `import AlertModal from '${importPath}';\nimport React`);
    }

    // 2. Inject AlertModal state & wrapper
    if (!content.includes('const [alertConfig')) {
        const compMatch = content.match(/(const \w+\s*=\s*\([^)]*\)\s*=>\s*\{)/);
        if (compMatch) {
            const hookStr = `
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', singleButton: true, onConfirm: null, btnText: 'Okay' });
    const showAlert = (title, message, buttons) => {
        if (buttons && buttons.length > 1) {
            const confirmBtn = buttons.find(b => b.text !== 'Cancel' && b.style !== 'cancel') || buttons[1];
            setAlertConfig({ visible: true, title, message, singleButton: false, onConfirm: confirmBtn.onPress, btnText: confirmBtn.text || 'Okay' });
        } else {
            setAlertConfig({ visible: true, title, message, singleButton: true, onConfirm: null, btnText: 'Okay' });
        }
    };
    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
`;
            content = content.replace(compMatch[1], compMatch[1] + '\n' + hookStr);
        }
    }

    // 3. Inject <AlertModal /> before last closing tag
    if (!content.includes('<AlertModal visible={alertConfig.visible}')) {
        const modalStr = `
            <AlertModal 
                visible={alertConfig.visible} 
                title={alertConfig.title} 
                message={alertConfig.message} 
                singleButton={alertConfig.singleButton} 
                onClose={hideAlert} 
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }} 
                btnText={alertConfig.btnText}
                isDark={isDark} 
            />`;
        
        const lastSafeArea = content.lastIndexOf('</SafeAreaView>');
        if (lastSafeArea !== -1) {
            content = content.slice(0, lastSafeArea) + modalStr + '\n        ' + content.slice(lastSafeArea);
        } else {
            const lastView = content.lastIndexOf('</View>');
            if (lastView !== -1) {
                content = content.slice(0, lastView) + modalStr + '\n        ' + content.slice(lastView);
            }
        }
    }

    // 4. Replace Alert.alert with showAlert
    content = content.replace(/Alert\.alert\(/g, 'showAlert(');

    fs.writeFileSync(file, content);
    console.log('Processed', file);
});
