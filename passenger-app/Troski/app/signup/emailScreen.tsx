import {View, Text, Pressable, TextInput} from 'react-native'
import React, {useState} from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store"

const EmailScreen = () => {
    const [emailAddress, setEmailAddress] = useState('')
    const setEmail = useAppStore((state) => state.setEmail);
    const [error, setError] = useState("");


    const isValidEmail = (email:string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isDisabled = !isValidEmail(emailAddress.trim());

    const handleNext = ()=>{

        if (!isValidEmail(emailAddress.trim())) {
            console.log("Invalid email");
            return;
        }

        setEmail(emailAddress.trim());
        router.push("../signup/phoneNumberScreen");
    }

    const handleEmailChange = (text: string) => {
        setEmailAddress(text);

        if (text.length === 0) {
            setError("");
            return;
        }

        if (!isValidEmail(text)) {
            setError("Enter a valid email address");
        } else {
            setError("");
        }
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
                            <Text className="text-xl font-medium">What&apos;s your email?</Text>
                        </View>

                        <TextInput
                            autoCorrect={false}
                            autoCapitalize="none"
                            value={emailAddress}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoFocus={true}
                            style={{paddingLeft: 16}}
                            className="bg-general mb-1 text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />
                        <View className="mb-6 w-full items-start">

                            {error ? (
                                <Text className="text-red-500 text-sm mt-1">
                                    {error}
                                </Text>
                            ) :
                                <Text className="text-sm ">You&apos;ll need to verify this email later.</Text>
                            }
                        </View>

                        <PrimaryButton name="Next" disabled={isDisabled} onPress={handleNext}/>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default EmailScreen
