import {View, Text, Pressable, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import OtpModal from "@/components/ui/OtpModal";

const OtpScreen = () => {
    const number = useAppStore((state) => state.number);
    const otpEndTime = useAppStore((state) => state.otpEndTime);
    const setOtpEndTime = useAppStore((state) => state.setOtpEndTime);
    const [showModal, setShowModal] = useState(false)


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
    };

    const handleOTP = ()=>{

        console.log("Code received")
        setShowModal(true)
    }

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <SafeAreaView className="flex-1">
                    <StatusBar style="dark"/>

                    {showModal?
                        <OtpModal/>: <><View className="w-full flex flex-row py-2 mb-2  ">
                            <View className="px-4 flex justify-center items-center">
                                <Pressable
                                    onPress={() => router.back()}
                                    className="rounded-full bg-general p-2 shadow-black shadow-2xl">
                                    <Ionicons name="arrow-back" size={24}/>
                                </Pressable>
                            </View>

                            <View className="flex justify-center items-center w-[65%]">
                                <Text className="text-xl font-medium">Login</Text>
                            </View>
                        </View><View className="w-full flex-1 flex items-center px-6">
                            <View className="w-full mb-4">
                                <Text className="text-2xl font-medium">Enter OTP</Text>
                                <Text className="text-sm ">Type in the 6-digit verification sent to {number} in the
                                    field provided.</Text>

                            </View>

                            <OtpInput
                                numberOfDigits={6}
                                autoFocus={true}
                                onFilled={handleOTP}
                                type="numeric"
                                placeholder="******"/>
                            <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                                <View className="flex flex-row justify-start w-full ">
                                    <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}}
                                              className="mt-1"/>
                                    <Text style={{flexShrink: 1}} className="text-sm mb-1 ">Do not share this PIN code
                                        with anyone. </Text>
                                </View>


                            </View>


                            <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                                {seconds > 0 ?
                                    <View className="flex flex-row justify-center items-center">
                                        <Text className="font-medium">Send another code: {seconds}</Text>
                                    </View>
                                    :
                                    <TouchableOpacity onPress={resendCode}
                                                      className="flex flex-row justify-center items-center"><Text
                                        className="font-bold text-yellow-500">Resend code</Text></TouchableOpacity>}

                            </View>
                        </View></>
                    }


                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default OtpScreen
