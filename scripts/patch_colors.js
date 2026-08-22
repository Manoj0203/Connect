const fs = require('fs');
const files = [
  'M:/RN_Proj/Connect/screens/NotificationsScreen.js',
  'M:/RN_Proj/Connect/screens/OtherProfile.js',
  'M:/RN_Proj/Connect/screens/RoomAboutScreen.js',
  'M:/RN_Proj/Connect/screens/RoomsScreen.js',
  'M:/RN_Proj/Connect/screens/RoomDetailScreen.js'
];

const newFunc = `    const stringToColor = (string) => {
        const PREDEFINED_COLORS = [
            '#00796B', // Dark Teal
            '#0288D1', // Dark Light Blue
            '#1976D2', // Dark Blue
            '#303F9F', // Dark Indigo
            '#512DA8', // Dark Deep Purple
            '#7B1FA2', // Dark Purple
            '#F57C00', // Dark Orange
            '#E64A19', // Dark Deep Orange
            '#5D4037', // Dark Brown
            '#455A64', // Dark Blue Grey
        ];
        if (!string) return PREDEFINED_COLORS[0];
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % PREDEFINED_COLORS.length;
        return PREDEFINED_COLORS[index];
    };`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const stringToColor = \(string\) => \{[\s\S]*?return PREDEFINED_COLORS\[index\];\s*\n\s*\};/, newFunc);
    fs.writeFileSync(file, content);
    console.log('Patched ' + file);
});
