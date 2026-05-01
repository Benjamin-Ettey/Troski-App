import {View, Text, Pressable, TextInput} from 'react-native'
import React from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";

const EmailScreen = () => {
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
                        <View className="w-full">
                            <Text className="text-xl font-medium">What&apos;s your email?</Text>
                        </View>

                        <TextInput
                            keyboardType="email-address"
                            autoFocus={true}
                            style={{paddingLeft: 16}}
                            className="bg-tertiaryWhite mb-1 text-secondaryBlack w-full border-2 border-black/10  py-4  rounded-xl focus:bg-general focus:border-2 focus:border-secondaryBlack"

                        />
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm ">You&apos;ll need to verify this email later.</Text>
                        </View>

                        <PrimaryButton name="Next" onPress={()=>router.push("/")}/>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default EmailScreen
