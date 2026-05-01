import {View, Text, Pressable, TextInput} from 'react-native'
import React from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";

const confirmPinScreen = () => {
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
                            <Text className="text-2xl font-medium">Verify 6 digit pin</Text>
                            <Text className="text-sm ">Re-enter 6 digit pin code</Text>

                        </View>

                        <OtpInput
                            numberOfDigits={6}
                            autoFocus={true}
                            onFilled={()=>console.log("Code re-entered and matches successfully.")}
                            type="numeric"


                        />
                        <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                            <View className="flex flex-row justify-start w-full ">
                                <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                                <Text style={{flexShrink: 1}}  className="text-sm mb-1 ">Do not share this PIN code with anyone as this will be used to access your wallet transactions. </Text>
                            </View>

                            <View className="flex flex-row justify-start w-full">
                                <Ionicons name="pin" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                                <Text className="text-sm mb-1 ">Use a pin you can easily remember.</Text>
                            </View>
                        </View>


                        <PrimaryButton name="Next" onPress={()=>router.push("../signup/fullNameScreen")}/>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default confirmPinScreen
