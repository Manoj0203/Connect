// PinButton.js

import React, { useRef } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";

const numbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ["CLR", 0, "⌫"],
];

function CustomButton({ value, onPress, isDark }) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const radius = useRef(new Animated.Value(12)).current;

    const onPressIn = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.85,
                useNativeDriver: false,
            }),
            Animated.timing(radius, {
                toValue: 18,
                duration: 80,
                useNativeDriver: false,
            }),
            Animated.timing(opacity, {
                toValue: 0.7,
                duration: 80,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const onPressOut = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: false,
            }),
            Animated.timing(radius, {
                toValue: 12,
                duration: 80,
                useNativeDriver: false,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 80,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const getButtonColor = () => {
        if (value === "CLR") {
            return "transparent";
        }

        if (value === "⌫") {
            return "transparent";
        }

        return isDark ? "#151515" : "#cdcdcd";
    };

    const getTextColor =() => {
        if(value === 'CLR'){
            return 'red'
        }
        if(value === 'Back'){
            return isDark?'#cecece': '#595959'
        }
        return isDark? '#fff' : '#000'
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },

        pinContainer: {
            flexDirection: "row",
            marginBottom: 40,
        },

        dot: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            marginHorizontal: 10,
        },

        dotFilled: {
            borderWidth: 0,
        },

        row: {
            flexDirection: "row",
        },

        key: {
            width: 70,
            height: 70,
            margin: 10,
            justifyContent: "center",
            alignItems: "center",
        },

        keyText: {
            color: getTextColor(),
            fontSize: 25,
            fontWeight: "600",
            fontFamily:'Anaheim-Bold',
        },

        actionText: {
            fontSize: 22,
        },
    });

    return (
        <Pressable
            onPress={() => onPress(value)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View
                style={[
                    styles.key,
                    {
                        backgroundColor: getButtonColor(),
                        transform: [{ scale }],
                        borderRadius: radius,
                        opacity,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.keyText,
                        typeof value === "string" && styles.actionText,
                    ]}
                >
                    {value}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

export default function PinButton({ pin, setPin }) {
    const isDark = useColorScheme() === "dark";

    const handlePress = (value) => {
        if (value === "CLR") {
            setPin("");
            return;
        }

        if (value === "⌫") {
            setPin((prev) => prev.slice(0, -1));
            return;
        }

        if (pin.length >= 4) {
            return;
        }

        setPin((prev) => prev + value);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },

        pinContainer: {
            flexDirection: "row",
            marginBottom: 40,
        },

        dot: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            marginHorizontal: 10,
        },

        dotFilled: {
            borderWidth: 0,
        },

        row: {
            flexDirection: "row",
        },

        key: {
            width: 70,
            height: 70,
            margin: 10,
            justifyContent: "center",
            alignItems: "center",
        },

        keyText: {
            color: "#fff",
            fontSize: 24,
            fontWeight: "600",
        },

        actionText: {
            fontSize: 18,
        },
    });

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? "#252525" : "#f6f6f6",
                },
            ]}
        >
            {/* PIN Dots */}
            <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                borderColor: isDark ? "#fff" : "#151515",
                            },
                            pin.length > index && [
                                styles.dotFilled,
                                {
                                    backgroundColor: isDark ? "#fff" : "#151515",
                                },
                            ],
                        ]}
                    />
                ))}
            </View>

            {/* Keypad */}
            {numbers.map((row, i) => (
                <View key={i} style={styles.row}>
                    {row.map((num, j) => (
                        <CustomButton
                            key={j}
                            value={num}
                            onPress={handlePress}
                            isDark={isDark}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
}

