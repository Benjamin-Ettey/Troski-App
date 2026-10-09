import {View, Text, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {OtpInput} from "react-native-otp-entry";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";
import {useColorScheme} from "nativewind";
import {registerPassenger, requestEmailOTP} from "@/api/auth";
import PaginateHomepage from "@/components/ui/PaginateHomepage";

const OtpScreen = () => {

    const number = useAppStore((state) => state.number);
    const email = useAppStore((state) => state.email);
    const name = useAppStore((state) => state.name);
    const pin = useAppStore((state) => state.pin);

    const otpEndTime = useAppStore((state) => state.otpEndTime);
    const setOtpEndTime = useAppStore((state) => state.setOtpEndTime);

    const {colorScheme} = useColorScheme();

    const [otpCode, setOtpCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const [via, setVia] = useState(true);

    useEffect(() => {
        if (!otpEndTime) {
            const end = Date.now() + 60 * 1000;
            setOtpEndTime(end);
        }
    }, []);

    const [seconds, setSeconds] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!otpEndTime) return;

            const diff = Math.max(
                0,
                Math.floor((otpEndTime - Date.now()) / 1000)
            );

            setSeconds(diff);

        }, 1000);

        return () => clearInterval(interval);
    }, [otpEndTime]);


    const resendCode = () => {
        const newEnd = Date.now() + 60 * 1000;

        setOtpEndTime(newEnd);
        setVia(true);

        // Clear any previous error
        setErrorMessage("");
        setOtpCode("");
    };


    const handleEmailCode = async () => {
        try {
            const result = await requestEmailOTP({
                name,
                email,
                purpose: "signup",
            });

            console.log("Email OTP sent:", result);

            const newEnd = Date.now() + 60 * 1000;

            setOtpEndTime(newEnd);
            setVia(false);

            // Clear any previous error
            setErrorMessage("");
            setOtpCode("");

        } catch (error: any) {
            console.log(
                "Email OTP request failed:",
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.msg ||
                error.response?.data?.message ||
                "Unable to send the verification code. Please try again."
            );
        }
    };


    const handleOTP = async (code: string) => {

        // Prevent another request if verification is already happening
        if (isVerifying) return;

        // Make sure we actually received 6 digits
        if (code.length !== 6) return;

        // Store the OTP locally on this screen
        setOtpCode(code);

        // Clear previous error
        setErrorMessage("");

        // Start verification: PaginateHomepage shows while this request is pending
        setIsVerifying(true);

        try {

            const result = await registerPassenger({
                email: email,
                phoneNumber: number,
                name: name,
                pin: pin,
                otpCode: code,
            });

            console.log("Passenger registration successful:", result);

            /*
             * Success: isVerifying stays true so PaginateHomepage stays up
             * until the homepage replaces this screen.
             */
            router.replace("/homepage");

        } catch (error: any) {

            console.log(
                "Passenger registration failed:",
                error.response?.data || error.message
            );

            const status = error.response?.status;
            const backendMessage = error.response?.data?.msg
                || error.response?.data?.message;

            if (
                status === 400 ||
                status === 401 ||
                status === 403
            ) {
                setErrorMessage(
                    backendMessage || "The verification code is incorrect. Please try again."
                );
            } else if (status === 429) {
                setErrorMessage(
                    backendMessage || "Too many attempts. Please try again later."
                );
            }
            else if (status === 409) {
                setErrorMessage(
                    backendMessage || "A user with this information already exists."
                );
            }
            else {
                setErrorMessage(
                    backendMessage || "Something went wrong. Please try again."
                );
            }

            /*
             * Failure: hide PaginateHomepage and return to this screen
             * with the error displayed.
             */
            setIsVerifying(false);
        }
    };


    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >
                <StatusBar style="auto"/>

                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full mb-4">
                        <Text className="text-2xl leading-7 dark:text-general font-GoogleSansMedium tracking-tight">
                            Enter OTP
                        </Text>

                        {via ?
                            <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">
                                Type in the 6-digit verification sent to{" "}
                                <Text className="font-GoogleSansBold dark:text-tertiaryWhit">
                                    {number}
                                </Text>{" "}
                                in the field provided.
                            </Text>
                            :
                            <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">
                                Type in the 6-digit verification sent to{" "}
                                <Text className="font-GoogleSansBold dark:text-tertiaryWhit">
                                    {email}
                                </Text>{" "}
                                in the field provided.</Text>
                        }
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
                                        : "#000000"
                            }
                        }}
                    />


                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">

                        {errorMessage ? (
                            <View className="flex flex-row justify-start items-center w-full">
                                <Ionicons
                                    name="alert-circle"
                                    size={12}
                                    color="#dc2626"
                                    style={{marginRight: "2%"}}
                                />

                                <Text
                                    style={{flexShrink: 1}}
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
                                    style={{marginRight: "2%"}}
                                />

                                <Text
                                    style={{flexShrink: 1}}
                                    className="text-sm dark:text-tertiaryWhite font-GoogleSansRegular"
                                >
                                    Do not share this PIN code with anyone.
                                </Text>
                            </View>
                        )}

                    </View>


                    <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">

                        {seconds > 0 ?
                            <View className="flex flex-row justify-center items-center">
                                <Text className="font-GoogleSansMedium text-base leading-5 dark:text-tertiaryWhite">
                                    Send another code: {seconds}
                                </Text>
                            </View>
                            :
                            <>
                                <TouchableOpacity
                                    onPress={resendCode}
                                    className="flex flex-row mb-2 justify-center items-center"
                                >
                                    <Text className="font-GoogleSansBold text-base leading-5 text-yellow-500">
                                        Resend code
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleEmailCode}
                                    className="flex flex-row px-2 py-1 justify-center items-center rounded-full dark:border-tertiaryGray border border-black"
                                >
                                    <Text className="font-GoogleSansBold text-base leading-5 text-secondaryBlack dark:text-tertiaryWhite">
                                        Send code via email
                                    </Text>
                                </TouchableOpacity>
                            </>
                        }

                    </View>

                </View>

            </KeyboardAwareScrollView>

            <KeyboardToolbar/>

            {/* LOADING STATE: only while the registerPassenger request is pending */}
            {isVerifying && <PaginateHomepage/>}
        </View>
    )
}

export default OtpScreen