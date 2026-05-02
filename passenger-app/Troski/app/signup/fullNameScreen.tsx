import {View, Text, Pressable, TextInput, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";

const FullnameScreen = () => {
    const [fullName, setFullName] = useState("")
    const isDisabled = fullName.trim().length <= 3;

    const handleFullName = (text: string)=>{
        setFullName(text)

    }

    const handleCreateAccount = () => {
        if (fullName.trim().length <= 3) return;

        router.push("../signup/otpScreen");
    };
    return (

        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
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
                            <Text className="text-xl font-medium">What&apos;s your full name?</Text>
                        </View>

                        <TextInput
                            value={fullName}
                            autoCorrect={false}
                            autoCapitalize="none"
                            onChangeText={handleFullName}
                            keyboardType="default"
                            autoFocus={true}
                            style={{paddingLeft: 16}}
                            className="bg-general mb-1 text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />
                        <View className="mb-8 w-full items-start">
                            <Text className="text-sm ">This shows on your Troski profile.</Text>
                            <Text className="text-sm ">Your full name should be at least 3 characters.</Text>

                        </View>

                        <View style={{height: 1}} className="w-full bg-tertiaryGray mb-4"/>

                        <View className="w-full mb-8">
                            <View className="flex flex-col mb-4">
                                <Text className="text-sm text-nowrap mb-1">By tapping on &quot;Create account&quot;, you agree to Troski&apos;s Terms of Use.</Text>
                                <TouchableOpacity><Text className="font-bold text-red-600 text-sm tracking-tighter">Terms of Use.</Text></TouchableOpacity>
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-sm text-nowrap mb-1">By tapping on &quot;Create account&quot;, you agree to Troski&apos;s Privacy policy</Text>
                                <TouchableOpacity><Text className="font-bold text-sm text-red-600 tracking-tighter">Privacy policy.</Text></TouchableOpacity>
                            </View>
                        </View>

                        <PrimaryButton disabled={isDisabled} name="Create account" onPress={handleCreateAccount}/>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default FullnameScreen
