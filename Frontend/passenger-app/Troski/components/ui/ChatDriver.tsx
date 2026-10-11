import React, { useRef, useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    SafeAreaView,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const ChatDriver = ({ visible = true, onClose }: ChatDriverProps) => {
    const flatListRef = useRef<FlatList<Message>>(null);
    const { colorScheme } = useColorScheme();

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

    const sendMessage = () => {
        const text = inputText.trim();
        if (!text) return;

        const newMessage: Message = {
            id: `${Date.now()}`,
            text,
            from: "user",
            time: Date.now(),
        };

        setMessages((previous) => [...previous, newMessage]);
        setInputText("");

        // Demo reply
        setTimeout(() => {
            const reply: Message = {
                id: `${Date.now()}-reply`,
                text: "Okay, on my way.",
                from: "driver",
                time: Date.now(),
            };
            setMessages((previous) => [...previous, reply]);
        }, 1200);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.from === "user";

        return (
            <View
                style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowDriver,
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
                                backgroundColor:
                                    colorScheme === "dark"
                                        ? "#44444455"
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
                                : colorScheme === "dark"
                                    ? "#ffffff"
                                    : "#0f172a",
                            fontSize: 14,
                        }}
                    >
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            colorScheme === "dark" ? "#000000" : "#ffffff",
                    },
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
                                    borderBottomColor:
                                        colorScheme === "dark"
                                            ? "#444444"
                                            : "#f1f5f9",
                                },
                            ]}
                        >

                            <TouchableOpacity
                                style={styles.closeButton}
                                className="p-2 rounded-full "
                                onPress={onClose}
                                accessibilityLabel="Close chat"
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={28}
                                    color={
                                        colorScheme === "dark"
                                            ? "#ffffff"
                                            : "#334155"
                                    }
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

                        {/* Message List */}
                        <View style={{ flex: 1 }} className="bg-tertiaryWhite dark:bg-secondaryBlack">
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
                                        <View
                                            style={[
                                                styles.emptyIcon
                                            ]}
                                        >
                                            <Ionicons
                                                name="chatbubbles-outline"
                                                size={96}
                                                color={colorScheme==="dark"? "#444444":"#000000"}
                                            />
                                        </View>
                                        <Text
                                            className="font-GoogleSansMedium text-secondaryBlack dark:text-general"
                                            style={{
                                                fontSize: 16,
                                                marginTop: 12,
                                            }}
                                        >
                                            Chat with your driver
                                        </Text>
                                        <Text
                                            className="font-GoogleSansRegular text-secondaryGray dark:text-secondaryGray"
                                            style={{
                                                fontSize: 13,
                                                textAlign: "center",
                                                marginTop: 4,
                                            }}
                                        >
                                            Send a message to coordinate your
                                            pickup.
                                        </Text>
                                    </View>
                                }
                                onContentSizeChange={() =>
                                    flatListRef.current?.scrollToEnd({
                                        animated: true,
                                    })
                                }
                            />
                        </View>

                        {/* Bottom Composer with Dynamic Padding */}
                        <View
                            style={[
                                styles.composer,
                                {
                                    borderTopColor:
                                        colorScheme === "dark"
                                            ? "#44444455"
                                            : "#a9a9a933",
                                    backgroundColor:
                                        colorScheme === "dark"
                                            ? "#000000"
                                            : "#ffffff",
                                    paddingBottom: isKeyboardVisible
                                        ? 64
                                        : Platform.OS === "ios"
                                            ? 0
                                            : 12,
                                },
                            ]}
                        >
                            <TextInput
                                className="font-GoogleSansRegular dark:text-general"
                                value={inputText}
                                onChangeText={setInputText}
                                autoFocus={true}
                                autoCorrect={false}
                                placeholder="Type a message.."
                                placeholderTextColor={
                                    colorScheme === "dark"
                                        ? "#444444"
                                        : "#a9a9a9"
                                }
                                multiline
                                blurOnSubmit={false}
                                style={[
                                    styles.input,
                                    {
                                        color:
                                            colorScheme === "dark"
                                                ? "#ffffff"
                                                : "#0f172a",
                                        backgroundColor:
                                            colorScheme === "dark"
                                                ? "#44444455"
                                                : "#e4e4e455",
                                        borderColor:
                                            colorScheme === "dark"
                                                ? "#44444455"
                                                : "#e4e4e455",
                                    },
                                ]}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    {
                                        backgroundColor: inputText.trim()
                                            ? "#22c55e"
                                            : colorScheme === "dark"
                                                ? "#44444455"
                                                : "#e4e4e455",
                                        opacity: inputText.trim() ? 1 : 0.7,
                                    },
                                ]}
                                onPress={sendMessage}
                                disabled={!inputText.trim()}
                                accessibilityLabel="Send message"
                            >
                                <Ionicons
                                    name="send"
                                    size={24}
                                    color={
                                        inputText.trim()
                                            ? "#ffffff"
                                            : colorScheme === "dark"
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
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    composer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 100,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
    },
    sendButton: {
        padding: 12,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default ChatDriver;