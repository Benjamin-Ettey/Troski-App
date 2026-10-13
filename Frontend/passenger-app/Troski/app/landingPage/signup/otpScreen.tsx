import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import {
    KeyboardAwareScrollView,
    KeyboardToolbar,
} from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import { router } from "expo-router";
import { useAppStore } from "@/utils/store";
import { useColorScheme } from "nativewind";
import {
    registerPassenger,
    requestEmailOTP,
} from "@/api/auth";
import PaginateHomepage from "@/components/ui/PaginateHomepage";

const OtpScreen = () => {
    const number = useAppStore((state) => state.number);
    const email = useAppStore((state) => state.email);
    const name = useAppStore((state) => state.name);
    const pin = useAppStore((state) => state.pin);

    const otpEndTime = useAppStore((state) => state.otpEndTime);
    const setOtpEndTime = useAppStore((state) => state.setOtpEndTime);

    const { colorScheme } = useColorScheme();

    const [otpCode, setOtpCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [via, setVia] = useState(true);

    const [seconds, setSeconds] = useState(60);

    useEffect(() => {
        if (!otpEndTime) {
            setOtpEndTime(Date.now() + 60 * 1000);
        }
    }, [otpEndTime, setOtpEndTime]);

    useEffect(() => {
        const updateTimer = () => {
            if (!otpEndTime) {
                setSeconds(60);
                return;
            }

            const diff = Math.max(
                0,
                Math.ceil((otpEndTime - Date.now()) / 1000)
            );

            setSeconds(diff);
        };

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [otpEndTime]);

    const resendCode = async () => {
        if (seconds > 0 || isSendingEmail || isVerifying) {
            return;
        }

        setErrorMessage("");
        setOtpCode("");

        // Request a new OTP instead of only resetting the timer.
        await handleEmailCode();
    };

    const handleEmailCode = async () => {
        if (isSendingEmail || isVerifying) {
            return;
        }

        setIsSendingEmail(true);
        setErrorMessage("");

        try {
            const result = await requestEmailOTP({
                name,
                email,
                purpose: "signup",
            });

            console.log("Email OTP sent:", result);

            setOtpEndTime(Date.now() + 60 * 1000);
            setVia(false);
            setOtpCode("");
            setErrorMessage("");
        } catch (error: any) {
            console.log(
                "Email OTP request failed:",
                error.response?.data || error.message
            );

            const status = error.response?.status;

            if (!error.response) {
                if (
                    error.code === "ECONNABORTED" ||
                    error.code === "ETIMEDOUT"
                ) {
                    setErrorMessage(
                        "The request took too long. Please try again."
                    );
                } else {
                    setErrorMessage(
                        "Unable to connect to the server. Please check your internet connection and try again."
                    );
                }
            } else if (status === 400) {
                setErrorMessage(
                    "Invalid information provided. Please check your details and try again."
                );
            } else if (status === 401 || status === 403) {
                setErrorMessage(
                    "We couldn't verify your request. Please try again."
                );
            } else if (status === 404) {
                setErrorMessage(
                    "The requested service could not be found. Please try again later."
                );
            } else if (status === 408) {
                setErrorMessage(
                    "The request timed out. Please try again."
                );
            } else if (status === 409) {
                setErrorMessage(
                    "This request conflicts with an existing account."
                );
            } else if (status === 422) {
                setErrorMessage(
                    "Some information is invalid. Please check your details and try again."
                );
            } else if (status === 429) {
                setErrorMessage(
                    "Too many requests. Please wait a while before trying again."
                );
            } else if (status >= 500 && status <= 599) {
                setErrorMessage(
                    "Our server is experiencing a problem. Please try again later."
                );
            } else if (status >= 400 && status <= 499) {
                setErrorMessage(
                    "We couldn't process your request. Please try again."
                );
            } else {
                setErrorMessage(
                    "Something went wrong. Please try again."
                );
            }
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleOTP = async (code: string) => {
        if (isVerifying || code.length !== 6) {
            return;
        }

        setOtpCode(code);
        setErrorMessage("");
        setIsVerifying(true);

        try {
            const result = await registerPassenger({
                email,
                phoneNumber: number,
                name,
                pin,
                otpCode: code,
            });

            console.log(
                "Passenger registration successful:",
                result
            );

            // Keep the loading screen visible while navigating.
            router.replace("/homepage");
        } catch (error: any) {
            console.log(
                "Passenger registration failed:",
                error.response?.data || error.message
            );

            const status = error.response?.status;

            if (!error.response) {
                if (
                    error.code === "ECONNABORTED" ||
                    error.code === "ETIMEDOUT"
                ) {
                    setErrorMessage(
                        "The request took too long. Please try again."
                    );
                } else {
                    setErrorMessage(
                        "Unable to connect to the server. Please check your internet connection and try again."
                    );
                }
            } else if (status === 400) {
                setErrorMessage(
                    "Invalid information provided. Please check your details and try again."
                );
            } else if (status === 401) {
                setErrorMessage(
                    "Your verification code is invalid or has expired. Please try again."
                );
            } else if (status === 403) {
                setErrorMessage(
                    "You are not allowed to perform this action. Please try again."
                );
            } else if (status === 404) {
                setErrorMessage(
                    "The requested service could not be found. Please try again later."
                );
            } else if (status === 408) {
                setErrorMessage(
                    "The request timed out. Please try again."
                );
            } else if (status === 409) {
                setErrorMessage(
                    "A user with this information already exists."
                );
            } else if (status === 422) {
                setErrorMessage(
                    "Some information is invalid. Please check your details and try again."
                );
            } else if (status === 429) {
                setErrorMessage(
                    "Too many attempts. Please wait a while before trying again."
                );
            } else if (status >= 500 && status <= 599) {
                setErrorMessage(
                    "Our server is experiencing a problem. Please try again later."
                );
            } else if (status >= 400 && status <= 499) {
                setErrorMessage(
                    "We couldn't process your request. Please try again."
                );
            } else {
                setErrorMessage(
                    "Something went wrong. Please try again."
                );
            }

            setIsVerifying(false);
        }
    };

    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >
                <StatusBar style="auto" />

                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl leading-7 dark:text-general font-GoogleSansMedium tracking-tight">
                            Enter OTP
                        </Text>

                        {via ? (
                            <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">
                                Type in the 6-digit verification sent to{" "}
                                <Text className="font-GoogleSansBold dark:text-tertiaryWhite">
                                    {number}
                                </Text>{" "}
                                in the field provided.
                            </Text>
                        ) : (
                            <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">
                                Type in the 6-digit verification sent to{" "}
                                <Text className="font-GoogleSansBold dark:text-tertiaryWhite">
                                    {email}
                                </Text>{" "}
                                in the field provided.
                            </Text>
                        )}
                    </View>

                    <OtpInput
                        numberOfDigits={6}
                        autoFocus={true}
                        onFilled={handleOTP}
                        type="numeric"
                        placeholder="******"
                        textInputProps={{
                            placeholderTextColor:
                                colorScheme === "dark"
                                    ? "#ffffff"
                                    : "#000000",
                        }}
                        textProps={{
                            style: {
                                color:
                                    colorScheme === "dark"
                                        ? "#ffffff"
                                        : "#000000",
                            },
                        }}
                    />

                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                        {errorMessage ? (
                            <View className="flex flex-row justify-start items-center w-full">
                                <Ionicons
                                    name="alert-circle"
                                    size={12}
                                    color="#dc2626"
                                    style={{ marginRight: "2%" }}
                                />

                                <Text
                                    style={{ flexShrink: 1 }}
                                    className="text-base mb-1 text-red-600 font-GoogleSansRegular"
                                >
                                    {errorMessage}
                                </Text>
                            </View>
                        ) : (
                            <View className="flex flex-row justify-start items-center w-full">
                                <Ionicons
                                    name="lock-closed"
                                    size={10}
                                    color="gray"
                                    style={{ marginRight: "2%" }}
                                />

                                <Text
                                    style={{ flexShrink: 1 }}
                                    className="text-sm dark:text-tertiaryWhite font-GoogleSansRegular"
                                >
                                    Do not share this PIN code with anyone.
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                        {seconds > 0 ? (
                            <View className="flex flex-row justify-center items-center">
                                <Text className="font-GoogleSansMedium text-base leading-5 dark:text-tertiaryWhite">
                                    Send another code: {seconds}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={resendCode}
                                    disabled={isSendingEmail || isVerifying}
                                    className="flex flex-row mb-2 justify-center items-center"
                                >
                                    <Text className="font-GoogleSansBold text-base leading-5 text-yellow-500">
                                        Resend code
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleEmailCode}
                                    disabled={isSendingEmail || isVerifying}
                                    className="flex flex-row px-2 py-1 justify-center items-center rounded-full dark:border-tertiaryGray border border-black"
                                >
                                    <Text className="font-GoogleSansBold text-base leading-5 text-secondaryBlack dark:text-tertiaryWhite">
                                        {isSendingEmail
                                            ? "Sending code..."
                                            : "Send code via email"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAwareScrollView>

            <KeyboardToolbar />

            {isVerifying && <PaginateHomepage />}
        </View>
    );
};

export default OtpScreen;

