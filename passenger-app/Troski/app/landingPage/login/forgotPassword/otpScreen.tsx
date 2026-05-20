import {View, Text, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import OtpModal from "@/components/ui/OtpModal";
import {useColorScheme} from "nativewind";
import {useRouter} from "expo-router";

const OtpScreen = () => {
    const number = useAppStore((state) => state.number);
    const email = useAppStore((state) => state.email);
    const otpEndTime = useAppStore((state) => state.otpEndTime);
    const setOtpEndTime = useAppStore((state) => state.setOtpEndTime);
    const {colorScheme} = useColorScheme();

    const router = useRouter();

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
        setVia(true)
    };

    const handleEmailCode = () =>{
        const newEnd = Date.now() + 60 * 1000;
        setOtpEndTime(newEnd);

        setVia(false)
    }

    const handleOTP = ()=>{

        console.log("Code received")
        router.push("/landingPage/login/forgotPassword/newPinScreen")

    }

    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="auto"/>



                        <View className="w-full flex-1 flex items-center px-6">
                            <View className="w-full mb-4">
                                <Text className="text-2xl leading-7 dark:text-general font-GoogleSansMedium tracking-tight">Enter OTP</Text>
                                {via?
                                    <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">Type in the 6-digit verification sent to <Text className="font-GoogleSansBold dark:text-tertiaryWhit">{number}</Text> in the
                                        field provided.</Text>
                                    :
                                    <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">Type in the 6-digit verification sent to <Text className="font-GoogleSansBold dark:text-tertiaryWhit">{email}</Text> in the
                                        field provided.</Text>
                                }


                            </View>

                            <OtpInput
                                numberOfDigits={6}
                                autoFocus={true}
                                onFilled={handleOTP}
                                type="numeric"
                                placeholder="******"
                                textInputProps={{
                                    placeholderTextColor: colorScheme === "dark"? "#ffffff": "#000000",
                                }}
                                textProps={{
                                    style: {color: colorScheme === "dark"? "#ffffff": "#000000"}
                                }}
                            />
                            <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                                <View className="flex flex-row justify-start w-full ">
                                    <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}}
                                              className="mt-1"/>
                                    <Text style={{flexShrink: 1}} className="text-sm leading-4 mb-1 dark:text-tertiaryWhite font-GoogleSansRegular">Do not share this PIN code
                                        with anyone. </Text>
                                </View>


                            </View>


                            <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                                {seconds > 0 ?
                                    <View className="flex flex-row justify-center items-center">
                                        <Text className="font-GoogleSansMedium text-base leading-5 dark:text-tertiaryWhite">Send another code: {seconds}</Text>
                                    </View>
                                    :
                                    <>
                                        <TouchableOpacity
                                            onPress={resendCode}
                                            className="flex flex-row mb-2 justify-center items-center">
                                            <Text className="font-GoogleSansBold text-base leading-5 text-yellow-500">Resend code</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleEmailCode}
                                            className="flex flex-row px-2 py-1 justify-center items-center  rounded-full dark:border-tertiaryGray border border-black">
                                            <Text className="font-GoogleSansBold text-base leading-5  text-secondaryBlack dark:text-tertiaryWhite">Send code via email</Text>
                                        </TouchableOpacity>

                                    </>

                                }

                            </View>
                        </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default OtpScreen
