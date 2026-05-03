import {View, Text, Pressable, TextInput} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";

const PhoneNumberScreen = () => {



    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const setNumber = useAppStore((state) => state.setNumber);

    const validate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setValue(cleaned);

        if (cleaned.length === 0) {
            setError('');
        } else if (cleaned.length !== 10) {
            setError('Number must be exactly 10 digits');
        } else {
            setError('');
        }
    };

    const handleNext = () => {
        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }

        setNumber(value);

        router.push("../signup/pinScreen");
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
                            <Text className="text-xl font-medium">What&apos;s your phone number?</Text>
                        </View>

                        <TextInput
                            maxLength={10}
                            value={value}
                            onChangeText={validate}
                            autoCorrect={false}
                            autoCapitalize="none"
                            keyboardType="phone-pad"
                            autoFocus={true}
                            style={{paddingLeft: 16, }}
                            className="bg-general mb-1 font-medium text-secondaryGray w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />


                        {error ? (
                            <View className="mb-6 w-full items-start">
                                <Text className="text-sm text-red-600">
                                    {error}
                                </Text>
                            </View>
                        ) : <View className="mb-6 w-full items-start">
                            <Text className="text-sm ">Make sure to enter a valid and active phone number.</Text>
                        </View>}

                        <PrimaryButton name="Next" disabled={value.length !== 10} onPress={handleNext}/>
                    </View>

                </SafeAreaView>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default PhoneNumberScreen
