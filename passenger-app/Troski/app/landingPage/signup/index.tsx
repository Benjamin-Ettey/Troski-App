import {View, Text, TextInput} from 'react-native'
import React, {useState} from 'react'
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store"
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const Index = () => {
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
        router.push("/landingPage/signup/phoneNumberScreen");
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

        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                    <StatusBar style="auto"/>




                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full py-2">
                            <Text className="text-xl leading-6 dark:text-general font-GoogleSansMedium tracking-tight">What&apos;s your email?</Text>
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
                            className="bg-general dark:bg-secondaryBlack dark:text-general dark:focus:border-tertiaryGray mb-1 font-GoogleSansMedium text-secondaryBlack w-full h-14 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />
                        <View className="mb-6 w-full items-start">

                            {error ? (
                                <Text className="text-red-500 text-sm leading-4 mt-1 font-GoogleSansMedium">
                                    {error}
                                </Text>
                            ) :
                                <Text className="text-sm leading-4 font-GoogleSansRegular dark:text-tertiaryGray">You&apos;ll need to verify this email later.</Text>
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
export default Index
