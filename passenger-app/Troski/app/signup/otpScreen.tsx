import {View, Text, Pressable, TouchableOpacity} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";

const OtpScreen = () => {
    const number = useAppStore((state) => state.number);

    const [active, setActive] = useState(true);
    const [seconds, setSeconds] =  useState(60);

    useEffect(() => {
         if (!active) return

         if (seconds===0){
             setActive(false);
             return
         }

         const timer = setTimeout(()=>{

             setSeconds(prevState => prevState-1)


             return()=>clearTimeout(timer)
         }, 1000);

    }, [seconds, active]);


    const resendCode = () => {

        setSeconds(60);
        setActive(true);
    }

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView className="flex-1">
                <SafeAreaView className="flex-1">
                    <StatusBar style="dark"/>

                    <View className="w-full flex flex-row py-2 mb-2  ">
                        <View className="px-4 flex justify-center items-center">
                            <Pressable
                                onPress={()=>router.back()}
                                className="rounded-full bg-general p-2 shadow-black shadow-2xl">
                                <Ionicons name="arrow-back" size={24} />
                            </Pressable>
                        </View>

                        <View className="flex justify-center items-center w-[65%]">
                            <Text className="text-xl font-medium">Create account</Text>
                        </View>
                    </View>


                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full mb-4">
                            <Text className="text-2xl font-medium">Enter your OTP</Text>
                            <Text className="text-sm ">Type in the 6-digit verification sent to {number} in the field provided.</Text>

                        </View>

                        <OtpInput
                            numberOfDigits={6}
                            autoFocus={true}
                            onFilled={()=>console.log("Code received")}
                            type="numeric"


                        />
                        <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                            <View className="flex flex-row justify-start w-full ">
                                <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                                <Text style={{flexShrink: 1}}  className="text-sm mb-1 ">Do not share this PIN code with anyone. </Text>
                            </View>


                        </View>

                        <PrimaryButton name="Next" disabled={false} onPress={()=>router.push("../signup/confirmPinScreen")}/>

                        <View className="flex flex-col gap-2 justify-center items-center w-full mt-4">
                            {active?
                                <View className="flex flex-row justify-center items-center">
                                    <Text className="font-medium">Send another code: {seconds}</Text>
                                </View>
                                :
                                <TouchableOpacity onPress={resendCode} className="flex flex-row justify-center items-center"><Text className="font-bold">Resend code</Text></TouchableOpacity>
                            }

                        </View>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default OtpScreen
