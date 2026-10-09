import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import PaginateHomepage from "@/components/ui/PaginateHomepage";

import { useAppStore } from "@/utils/store";
import { loginPassenger } from "@/api/auth";

const PinScreen = () => {
    const { colorScheme } = useColorScheme();

    const number = useAppStore((state) => state.number);

    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const disable = value.length !== 6 || isLoggingIn;

    const handleNext = async () => {
        if (value.length !== 6) {
            setError("Please enter your 6 digit PIN.");
            return;
        }

        if (!number) {
            setError("Phone number is missing. Please try again.");
            return;
        }

        if (isLoggingIn) {
            return;
        }

        setError("");
        setIsLoggingIn(true);

        try {
            const result = await loginPassenger({
                phoneNumber: number,
                pin: value,
            });

            console.log("Passenger login successful:", result);


            setAttempts(0);
            setValue("");

            router.replace("/homepage");
        } catch (error: any) {
            console.log(
                "Passenger login failed:",
                error.response?.data || error.message
            );

            const status = error.response?.status;

            const backendMessage =
                error.response?.data?.msg ||
                error.response?.data?.message;

            if (status === 400 || status === 401) {
                setAttempts((prev) => prev + 1);

                setError(
                    backendMessage ||
                    "Incorrect Phone number or Pin. Please try again."
                );
            } else if (status === 429) {
                setError(
                    backendMessage ||
                    "Too many attempts. Please try again later."
                );
            } else {
                setError(
                    backendMessage ||
                    "Unable to log in. Please try again."
                );
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleKeyPress = (key: string) => {
        if (error) {
            setError("");
        }

        if (key === "back") {
            setValue((prev) => prev.slice(0, -1));
            return;
        }

        if (!key) {
            return;
        }

        if (value.length < 6) {
            setValue((prev) => prev + key);
        }
    };

    const keypad = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["", "0", "back"],
    ];

    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <StatusBar style="auto" />

            <View className="flex-1 px-6">

                <View className="w-full mb-5">
                    <Text className="text-2xl leading-7 dark:text-general text-black font-GoogleSansMedium tracking-tight">
                        Enter 6 digit pin
                    </Text>

                    <Text className="text-sm leading-4 mt-1 dark:text-tertiaryWhite text-gray-600 font-GoogleSansRegular">
                        Type in your 6 digit code you used during account creation.
                    </Text>
                </View>

                <View className="flex-row justify-between items-center w-full mb-4">
                    {[...Array(6)].map((_, index) => {
                        const filled = value[index];

                        return (
                            <View
                                key={index}
                                className={`
                                    w-14 h-16 rounded-2xl
                                    border
                                    items-center justify-center
                                    dark:bg-secondaryBlack
                                    bg-white
                                    ${
                                    filled
                                        ? "border-green-600"
                                        : "border-tertiaryGray dark:border-tertiaryGray"
                                }
                                `}
                            >
                                <Text className="text-2xl dark:text-white text-black font-GoogleSansMedium">
                                    {filled ? "*" : ""}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <View className="w-full mb-1">
                    <View className="flex-row items-start w-full">
                        <Ionicons
                            name="lock-closed"
                            size={12}
                            color="gray"
                        />

                        <Text
                            style={{ flexShrink: 1 }}
                            className="text-sm pl-2 leading-4 dark:text-tertiaryGray text-gray-500 font-GoogleSansRegular"
                        >
                            Do not share this PIN code with anyone.
                        </Text>
                    </View>
                </View>

                {error ? (
                    <View className="w-full gap-2 mb-3 flex flex-row justify-start items-center">
                        <Ionicons
                            name="alert"
                            size={12}
                            color="red"
                        />

                        <Text className="text-red-500 text-sm font-GoogleSansRegular">
                            {error}
                        </Text>
                    </View>
                ) : null}

                <View className="w-full mt-14 mb-6">
                    {keypad.map((row, rowIndex) => (
                        <View
                            key={rowIndex}
                            className="flex-row justify-center gap-8 mb-5"
                        >
                            {row.map((item, index) => {
                                const isBackspace = item === "back";
                                const isEmpty = item === "";

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.7}
                                        disabled={
                                            isEmpty || isLoggingIn
                                        }
                                        onPress={() =>
                                            handleKeyPress(item)
                                        }
                                        className={`
                                            w-20 h-20 rounded-full
                                            items-center justify-center
                                            ${
                                            isEmpty
                                                ? "bg-transparent"
                                                : "bg-tertiaryWhite dark:bg-zinc-900"
                                        }
                                        `}
                                    >
                                        {isBackspace ? (
                                            <Ionicons
                                                name="backspace-outline"
                                                size={30}
                                                color={
                                                    colorScheme === "dark"
                                                        ? "#ffffff"
                                                        : "#000000"
                                                }
                                            />
                                        ) : (
                                            <Text className="text-3xl dark:text-white text-black font-GoogleSansMedium">
                                                {item}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>

                <View className="w-full justify-center items-center">
                    {attempts >= 3 && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                                router.replace(
                                    "/landingPage/login/forgotPassword"
                                )
                            }
                            className="mb-2 border border-secondaryBlack dark:border-primary px-2 py-1 rounded-full"
                        >
                            <Text className="dark:text-primary text-secondaryBlack text-sm font-GoogleSansMedium">
                                Forgot PIN?
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View className="mt-auto mb-10 justify-center items-center">
                    {isLoggingIn ? (
                        <PaginateHomepage />
                    ) : (
                        <PrimaryButton
                            name="Next"
                            disabled={disable}
                            onPress={handleNext}
                        />
                    )}
                </View>

            </View>
        </View>
    );
};

export default PinScreen;