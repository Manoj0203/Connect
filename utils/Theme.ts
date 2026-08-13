import { useColorScheme } from "react-native"

// ─────────────────────────────────────────────────────────
// DESIGN TOKENS
// A single accent (indigo) replaces the old neon green,
// paired with calmer neutrals and a consistent radius/spacing
// scale so every screen reads as one product.
// ─────────────────────────────────────────────────────────
const palette = {
    accent: "#00B341",
    accentDark: "#06ec06",
    accentSoft: "#E6F9EC",
    accentSoftDark: "#173620",
    success: "#22C55E",
    danger: "#F04452",

    // Dark mode
    bgDark: "#121214",
    surfaceDark: "#1C1C1F",
    cardDark: "#222226",
    borderDark: "#2E2E33",
    textDark: "#F4F4F6",
    textMutedDark: "#9A9AA5",

    // Light mode
    bgLight: "#F7F7FA",
    surfaceLight: "#FFFFFF",
    cardLight: "#FFFFFF",
    borderLight: "#E7E7ED",
    textLight: "#17171B",
    textMutedLight: "#75758A",
}

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const useTheme = () => {
    const isDark = useColorScheme() === 'dark';

    const bg = isDark ? palette.bgDark : palette.bgLight;
    const surface = isDark ? palette.surfaceDark : palette.surfaceLight;
    const card = isDark ? palette.cardDark : palette.cardLight;
    const border = isDark ? palette.borderDark : palette.borderLight;
    const text = isDark ? palette.textDark : palette.textLight;
    const textMuted = isDark ? palette.textMutedDark : palette.textMutedLight;
    const accentSoft = isDark ? palette.accentSoftDark : palette.accentSoft;
    const accentColor = isDark ? palette.accentDark : palette.accent;

    return {
        // Raw palette, exposed for screens that need one-off colors
        palette: {
            ...palette,
            bg, surface, card, border, text, textMuted, accentSoft,
        },
        SPACING,
        RADIUS,

        Colour:
        {
            bg: {
                backgroundColor: bg,
                flex: 1,
            },
            surface: {
                backgroundColor: surface,
            },
            card: {
                backgroundColor: card,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: border,
            },
            accent: accentColor,
            accentSoft,
            border,
            textPrimary: text,
            textSecondary: textMuted,
            danger: palette.danger,
            success: palette.success,
            shadow: {
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.35 : 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
            },
        },
        TEXT:
        {
            heading: {
                color: text,
                fontFamily: "Anaheim-Bold",
                fontSize: 28,
                letterSpacing: 0.2,
            },
            subheading: {
                color: text,
                fontFamily: "Anaheim-SemiBold",
                fontSize: 19,
                marginLeft: '2.5%',
                marginBottom: '2%'
            },
            moto: {
                fontFamily: "Anaheim-Bold",
                fontSize: 15,
                color: accentColor,
            },
            usernametxt: {
                fontFamily: "Anaheim-Bold",
                fontSize: 20,
                color: text,
                marginLeft: 15
            },
            detailsSideHeading: {
                color: textMuted,
                fontFamily: "Anaheim-Regular",
                fontSize: 14,
            },
            emptyTextContainer: {
                color: textMuted,
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 14
            },
            neonText: {
                fontSize: 18,
                color: isDark?'rgb(0, 201, 3)':'#0040ff',
                fontFamily:'Anaheim-Bold',
                textShadowColor: isDark?'rgb(0, 201, 3)':'#00c9c9ff', 
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 25,
            },
            imageSelectortxt: {
                margin: '2%',
                fontFamily: 'Anaheim-Bold',
                color: text,
            }
        },
        TEXTINPUT:
        {
            txtinput:
            {
                backgroundColor: isDark ? '#2A2A2F' : '#EFEFF4',
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 14,
                marginVertical: 6,
                minWidth: '80%',
                minHeight: 46,
                color: text,
                fontFamily: 'Anaheim-SemiBold'
            },
            famNameinput:
            {
                backgroundColor: 'rgba(0,0,0,0)',
                color: text,
                fontSize: 24,
                fontFamily: "Anaheim-Bold",
                maxWidth: 350,
                width: 'auto',
            },
            personNameinput:
            {
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -7,
                fontFamily: 'Anaheim-SemiBold',
                color: text,
            },
            generationInput:
            {
                fontFamily: "Anaheim-SemiBold",
                fontSize: 20,
                textAlign: 'center',
                color: text,
            },
            detailsSideEntry: {
                marginTop: '-2.8%',
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 15,
                color: text,
                width: '100%',
            }
        },
        BUTTON:
        {
            primary: {
                backgroundColor: accentColor,
                paddingVertical: 12,
                borderRadius: RADIUS.md,
                alignItems: 'center',
                justifyContent: 'center',
            },
            primaryText: {
                color: '#fff',
                fontSize: 15,
                fontFamily: 'Anaheim-Bold',
            },
            subbtn: {
                borderWidth: 1.5,
                borderColor: accentColor,
                paddingVertical: 10,
                width: '55%',
                borderRadius: RADIUS.md,
                alignItems: 'center',
                marginTop: '10%'
            },
            subbtntxt:
            {
                color: accentColor,
                fontSize: 15,
                fontFamily: 'Anaheim-Bold'
            },
            settingbtntxt: {
                color: text,
                marginLeft: '3%',
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 15,
            }
        },
        PROFILEPIC:
        {
            settinguppic:
            {
                width: 65,
                height: 65,
                borderRadius: RADIUS.md,
                marginBottom: '6%'
            },
            ProfileScreenpic: {
                marginVertical: '2.5%',
                height: 72,
                width: 72,
                borderRadius: RADIUS.lg,
                marginLeft: '0%',
                borderWidth: 2,
                borderColor: isDark ? palette.cardDark : '#fff',
            },
            editsharebtn: {
                alignItems: 'center',
                borderRadius: RADIUS.md,
                backgroundColor: accentSoft,
                paddingVertical: 9,
                flex: 1,
                justifyContent: "center",
            },
        },
        isDark,
    };
};