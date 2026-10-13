import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { useColorScheme } from "nativewind";

type Message = {
    id: string;
    text: string;
    from: "user" | "driver";
    time: number;
};

type ChatDriverProps = {
    visible?: boolean;
    onClose: () => void;
};



const SUGGESTIONS = [
    "I'm here",
    "I'm at the pickup point",
    "Where are you?",
    "Please wait a moment",
    "I'm coming out now",
    "Thank you!",
];

const CONTROL_SIZE = 38;

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
};

const ChatDriver = ({ visible = true, onClose }: ChatDriverProps) => {
    const flatListRef = useRef<FlatList<Message>>(null);
    const inputRef = useRef<TextInput>(null);
    const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Track keyboard open/close state dynamically
    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showListener = Keyboard.addListener(showEvent, () => {
            setIsKeyboardVisible(true);
        });

        const hideListener = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // Clear any pending demo reply on unmount
    useEffect(() => {
        return () => {
            if (replyTimeout.current) clearTimeout(replyTimeout.current);
        };
    }, []);


    const handleModalShow = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const submitMessage = (rawText: string) => {
        const text = rawText.trim();
        if (!text) return;

        const now = Date.now();

        const newMessage: Message = {
            id: `${now}`,
            text,
            from: "user",
            time: now,
        };

        setMessages((previous) => [...previous, newMessage]);

        // Demo reply
        replyTimeout.current = setTimeout(() => {
            const replyTime = Date.now();

            const reply: Message = {
                id: `${replyTime}-reply`,
                text: "Okay, on my way.",
                from: "driver",
                time: replyTime,
            };

            setMessages((previous) => [...previous, reply]);
        }, 1200);
    };

    // Send what's typed in the input, then clear it
    const handleSend = () => {
        if (!inputText.trim()) return;
        submitMessage(inputText);
        setInputText("");
    };

    // Send a suggestion instantly (any half-typed draft is left untouched)
    const handleSuggestionPress = (suggestion: string) => {
        submitMessage(suggestion);
    };

    const renderMessage = useCallback(
        ({ item }: { item: Message }) => {
            const isUser = item.from === "user";
            const timeLabel = formatTime(item.time);

            const timeColor = isUser
                ? "rgba(255,255,255,0.75)"
                : isDark
                    ? "#9ca3af"
                    : "#64748b";

            return (
                <View
                    style={[
                        styles.messageRow,
                        isUser
                            ? styles.messageRowUser
                            : styles.messageRowDriver,
                    ]}
                >
                    <View
                        style={[
                            styles.bubble,
                            isUser
                                ? {
                                    backgroundColor: "#22c55e",
                                    borderBottomRightRadius: 4,
                                }
                                : {
                                    backgroundColor: isDark
                                        ? "#000000"
                                        : "#ffffff",
                                    borderBottomLeftRadius: 4,
                                },
                        ]}
                    >
                        <Text
                            className="font-GoogleSansRegular"
                            style={{
                                color: isUser
                                    ? "#ffffff"
                                    : isDark
                                        ? "#ffffff"
                                        : "#0f172a",
                                fontSize: 14,
                            }}
                        >
                            {item.text}

                            <Text
                                style={{
                                    color: "transparent",
                                    fontSize: 11,
                                }}
                            >
                                {`\u00A0\u00A0\u00A0${timeLabel}`}
                            </Text>
                        </Text>

                        <Text
                            className="font-GoogleSansRegular"
                            style={[styles.time, { color: timeColor }]}
                        >
                            {timeLabel}
                        </Text>
                    </View>
                </View>
            );
        },
        [isDark]
    );

    const hasText = !!inputText.trim();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
            onShow={handleModalShow}
        >
            <SafeAreaView
                style={[
                    styles.safeArea,
                    { backgroundColor: isDark ? "#000000" : "#F5F0E855" },
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.container}>
                        {/* Chat Header */}
                        <View
                            style={[
                                styles.header,
                                {
                                    borderBottomColor: isDark
                                        ? "#44444433"
                                        : "#EDE3D7",
                                },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.closeButton}
                                className="p-2 rounded-full"
                                onPress={onClose}
                                accessibilityLabel="Close chat"
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={28}
                                    color={isDark ? "#ffffff" : "#334155"}
                                />
                            </TouchableOpacity>

                            <View style={styles.avatar}>
                                <Ionicons
                                    name="person"
                                    color="#ffcc00"
                                    size={18}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    numberOfLines={1}
                                    className="font-GoogleSansMedium text-lg text-secondaryBlack dark:text-general"
                                >
                                    Kelvin Agyeman
                                </Text>
                            </View>
                        </View>

                        {/* Message List with Background Image */}
                        <View
                            style={[
                                styles.listWrapper,
                                { backgroundColor: isDark ? "#0b0b0b" : "#FAF7F2" },
                            ]}
                        >

                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id}
                                renderItem={renderMessage}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{
                                    flexGrow: 1,
                                    paddingTop: 16,
                                    paddingBottom: 16,
                                    paddingHorizontal: 16,
                                }}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <View className="bg-secondaryBlack w-[90%] rounded-xl flex justify-center items-center px-4 py-3">


                                            <View className="flex flex-row gap-2 justify-center items-center">

                                                <Ionicons
                                                    name="paper-plane"
                                                    size={16}
                                                    color="white"
                                                />
                                                <Text
                                                    className="font-GoogleSansRegular text-general "
                                                    style={{
                                                        fontSize: 16,

                                                    }}
                                                >
                                                    No messages yet...
                                                </Text>
                                            </View>


                                            <Text
                                                className="font-GoogleSansRegular text-general "
                                                style={{
                                                    fontSize: 13,
                                                    textAlign: "center",
                                                    marginTop: 4,
                                                }}
                                            >
                                                Chat with driver to coordinate your
                                                pickup.
                                            </Text>

                                        </View>

                                    </View>
                                }
                                onContentSizeChange={() =>
                                    flatListRef.current?.scrollToEnd({
                                        animated: true,
                                    })
                                }
                            />
                        </View>

                        {/* Quick-reply suggestions */}
                        <View
                            style={{
                                backgroundColor: isDark ? "#000000" : "#F5F0E855",
                            }}
                        >
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={styles.suggestionsContent}
                            >
                                {SUGGESTIONS.map((suggestion) => (
                                    <TouchableOpacity
                                        key={suggestion}
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            handleSuggestionPress(suggestion)
                                        }
                                        accessibilityLabel={`Send "${suggestion}"`}
                                        style={[
                                            styles.suggestionChip,
                                            {
                                                backgroundColor: isDark
                                                    ? "#44444455"
                                                    : "#ffffff",
                                                borderColor: isDark
                                                    ? "#44444455"
                                                    : "#00000022",
                                            },
                                        ]}
                                    >
                                        <Text
                                            className="font-GoogleSansRegular"
                                            style={{
                                                fontSize: 13,
                                                color: isDark
                                                    ? "#ffffff"
                                                    : "#0f172a",
                                            }}
                                        >
                                            {suggestion}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Bottom Composer */}
                        <View
                            style={[
                                styles.composer,
                                {
                                    borderTopColor: isDark
                                        ? "#000000"
                                        : "#F5F0E855",
                                    backgroundColor: isDark
                                        ? "#000000"
                                        : "#F5F0E855",
                                    paddingBottom: isKeyboardVisible
                                        ? 64
                                        : Platform.OS === "ios"
                                            ? 0
                                            : 12,
                                },
                            ]}
                        >
                            <TextInput
                                ref={inputRef}
                                className="font-GoogleSansRegular dark:text-general"
                                value={inputText}
                                onChangeText={setInputText}
                                autoCorrect={false}
                                placeholder="Type a message.."
                                placeholderTextColor={
                                    isDark ? "#444444" : "#a9a9a9"
                                }
                                multiline
                                blurOnSubmit={false}
                                style={[
                                    styles.input,
                                    {
                                        color: isDark ? "#ffffff" : "#0f172a",
                                        backgroundColor: isDark
                                            ? "#44444455"
                                            : "#ffffff",
                                        borderColor: isDark
                                            ? "#44444455"
                                            : "#00000022",
                                    },
                                ]}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    {
                                        backgroundColor: hasText
                                            ? "#22c55e"
                                            : isDark
                                                ? "#44444455"
                                                : "#e4e4e455",
                                        opacity: hasText ? 1 : 0.7,
                                    },
                                ]}
                                onPress={handleSend}
                                disabled={!hasText}
                                accessibilityLabel="Send message"
                            >
                                <Ionicons
                                    name="send"
                                    size={18}
                                    color={
                                        hasText
                                            ? "#ffffff"
                                            : isDark
                                                ? "#444444"
                                                : "#94a3b8"
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    listWrapper: {
        flex: 1,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#ffcc0020",
        borderWidth: 1.5,
        borderColor: "#ffcc00",
        alignItems: "center",
        justifyContent: "center",
    },
    closeButton: {
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
    },
    emptyIcon: {
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    messageRow: {
        flexDirection: "row",
        marginVertical: 4,
    },
    messageRowUser: {
        justifyContent: "flex-end",
    },
    messageRowDriver: {
        justifyContent: "flex-start",
    },
    bubble: {
        maxWidth: "82%",
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    time: {
        position: "absolute",
        right: 10,
        bottom: 6,
        fontSize: 11,
    },
    suggestionsContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 8,
    },
    suggestionChip: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
    },
    composer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        height: CONTROL_SIZE,
        borderRadius: CONTROL_SIZE / 2,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 10 : 0,
        paddingBottom: Platform.OS === "ios" ? 10 : 0,
        textAlignVertical: "center",
        fontSize: 14,
    },
    sendButton: {
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        borderRadius: CONTROL_SIZE / 2,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default ChatDriver;