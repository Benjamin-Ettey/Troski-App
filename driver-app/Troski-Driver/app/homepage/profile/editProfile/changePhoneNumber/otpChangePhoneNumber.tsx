import {View, Text, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import OtpChangePhoneNumberModal from "@/components/ui/OtpChangePhoneNumberModal";


const OTPChangePhoneNumber = () => {
    const drivernumber = useAppStore((state) => state.drivernumber);
    const driveremail = useAppStore((state) => state.driveremail);
    const driverOtpEndTime = useAppStore((state) => state.driverOtpEndTime);
    const setDriverOtpEndTime = useAppStore((state) => state.setDriverOtpEndTime);
    const [showModal, setShowModal] = useState(false);


    const [via, setVia] = useState(true);


    useEffect(() => {
        if (!driverOtpEndTime) {
            const end = Date.now() + 60 * 1000;
            setDriverOtpEndTime(end);
        }
    }, []);

    const [seconds, setSeconds] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!driverOtpEndTime) return;

            const diff = Math.max(
                0,
                Math.floor((driverOtpEndTime - Date.now()) / 1000)
            );

            setSeconds(diff);

        }, 1000);

        return () => clearInterval(interval);
    }, [driverOtpEndTime]);


    const resendCode = () => {
        const newEnd = Date.now() + 60 * 1000;
        setDriverOtpEndTime(newEnd);
        setVia(true)
    };

    const handleEmailCode = () =>{
        const newEnd = Date.now() + 60 * 1000;
        setDriverOtpEndTime(newEnd);

        setVia(false)
    }

    const handleOTP = ()=>{

        console.log("Code received")
        setShowModal(true)
    }

    return (
        <View
            style={{backgroundColor: "#F5F7FA"}}
            className="flex-1 ">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>

                {showModal?
                    <OtpChangePhoneNumberModal/>: <>

                        <View className="w-full flex-1 flex items-center px-6">
                            <View className="w-full mb-4">
                                <Text className="text-2xl leading-7 font-GoogleSansMedium tracking-tight ">Enter OTP</Text>
                                {via?
                                    <Text className="text-sm leading-5 font-GoogleSansRegular ">Type in the 6-digit verification sent to <Text className="font-GoogleSansBold">{drivernumber}</Text> in the
                                        field provided.</Text>
                                    :
                                    <Text className="text-sm leading-5 font-GoogleSansRegular ">Type in the 6-digit verification sent to <Text className="font-GoogleSansMedium">{driveremail}</Text> in the
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
                                    placeholderTextColor: "#000000",
                                }}
                                textProps={{
                                    style: {color: "#000000"}
                                }}
                            />
                            <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                                <View className="flex flex-row justify-start w-full items-center">
                                    <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}}
                                              className=""/>
                                    <Text
                                        className="text-sm leading-5 flex-shrink  font-GoogleSansRegular ">Do not share this PIN code
                                        with anyone. </Text>
                                </View>


                            </View>


                            <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                                {seconds > 0 ?
                                    <View className="flex flex-row justify-center items-center">
                                        <Text className="font-GoogleSansMedium text-base leading-5 ">Send another code: {seconds}</Text>
                                    </View>
                                    :
                                    <>
                                        <TouchableOpacity
                                            onPress={resendCode}
                                            className="flex flex-row mb-3 justify-center items-center">
                                            <Text className="font-GoogleSansBold text-base leading-5 text-yellow-500">Resend code</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleEmailCode}
                                            className="flex flex-row justify-center px-2 py-1 items-center  rounded-full border border-black">
                                            <Text className="font-GoogleSansBold  text-base leading-5 text-secondaryBlack ">Send code via email</Text>
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
export default OTPChangePhoneNumber
