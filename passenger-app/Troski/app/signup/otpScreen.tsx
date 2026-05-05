import {View, Text, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import OtpModal from "@/components/ui/OtpModal";

const OtpScreen = () => {
    const number = useAppStore((state) => state.number);
    const email = useAppStore((state) => state.email);
    const otpEndTime = useAppStore((state) => state.otpEndTime);
    const setOtpEndTime = useAppStore((state) => state.setOtpEndTime);
    const [showModal, setShowModal] = useState(false);

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
        setShowModal(true)
    }

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>

                {showModal?
                    <OtpModal/>: <>

                        <View className="w-full flex-1 flex items-center px-6">
                            <View className="w-full mb-4">
                                <Text className="text-2xl font-GoogleSansMedium tracking-tight">Enter OTP</Text>
                                {via?
                                    <Text className="text-sm font-GoogleSansRegular">Type in the 6-digit verification sent to <Text className="font-GoogleSansBold">{number}</Text> in the
                                        field provided.</Text>
                                    :
                                    <Text className="text-sm font-GoogleSansRegular">Type in the 6-digit verification sent to <Text className="font-GoogleSansBold">{email}</Text> in the
                                        field provided.</Text>
                                }


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
                                    <Text style={{flexShrink: 1}} className="text-sm mb-1 font-GoogleSansRegular">Do not share this PIN code
                                        with anyone. </Text>
                                </View>


                            </View>


                            <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                                {seconds > 0 ?
                                    <View className="flex flex-row justify-center items-center">
                                        <Text className="font-GoogleSansMedium">Send another code: {seconds}</Text>
                                    </View>
                                    :
                                    <>
                                        <TouchableOpacity
                                            onPress={resendCode}
                                            style={{marginBottom: 10}}
                                            className="flex flex-row justify-center items-center">
                                            <Text className="font-GoogleSansBold text-yellow-500">Resend code</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleEmailCode}
                                            style={{paddingVertical: 4, paddingHorizontal: 8}}
                                            className="flex flex-row justify-center items-center  rounded-full border border-black">
                                            <Text className="font-GoogleSansBold text-secondaryBlack">Send code via email</Text>
                                        </TouchableOpacity>

                                    </>

                                }

                            </View>
                        </View></>
                }


            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default OtpScreen
