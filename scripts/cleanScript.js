const fs = require('fs');

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

const targetPattern = /<AlertModal\s*visible=\{alertConfig\.visible\}\s*title=\{alertConfig\.title\}\s*message=\{alertConfig\.message\}\s*singleButton=\{alertConfig\.singleButton\}\s*onClose=\{hideAlert\}\s*onConfirm=\{\(\)\s*=>\s*\{\s*if\s*\(alertConfig\.onConfirm\)\s*alertConfig\.onConfirm\(\);\s*hideAlert\(\);\s*\}\}\s*btnText=\{alertConfig\.btnText\}\s*isDark=\{isDark\}\s*\/>/g;

const replacement = `<AlertModal 
                config={alertConfig} 
                onClose={hideAlert} 
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); hideAlert(); }} 
                isDark={isDark} 
            />`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (targetPattern.test(content)) {
        content = content.replace(targetPattern, replacement);
        fs.writeFileSync(file, content);
        console.log('Cleaned', file);
    } else {
        console.log('No match found in', file);
    }
});
