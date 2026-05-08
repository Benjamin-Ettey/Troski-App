import {View, Text, TextInput} from 'react-native'
import React, {useState} from 'react'
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store"
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

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
                    <StatusBar style="dark"/>




                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full">
                            <Text className="text-xl font-GoogleSansMedium tracking-tight">What&apos;s your email?</Text>
                        </View>

                        <TextInput
                            autoCorrect={false}
                            autoCapitalize="none"
                            textContentType="emailAddress"
                            autoComplete="email"
                            value={emailAddress}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoFocus={true}
                            style={{paddingLeft: 16}}
                            className="bg-general mb-1 font-GoogleSansMedium text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />
                        <View className="mb-6 w-full items-start">

                            {error ? (
                                <Text className="text-red-500 text-sm mt-1 font-GoogleSansMedium">
                                    {error}
                                </Text>
                            ) :
                                <Text className="text-sm font-GoogleSansRegular">You&apos;ll need to verify this email later.</Text>
                            }
                        </View>

                        {isDisabled?
                            (<DisabledPrimaryButton name="Next" />)
                            :
                            (<PrimaryButton name="Next" disabled={isDisabled} onPress={handleNext}/>)

                        }
                    </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default EmailScreen
