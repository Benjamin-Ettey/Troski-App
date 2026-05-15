import {View, Text, TextInput} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const Index = () => {

    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const isDisabled = value.length !== 10;

    const number = useAppStore((state)=> state.number);

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

        if (value !== number){
            setError('Use your registered number to sign in, or create an account if this is your first time.')
            return;
        }

        router.push("/landingPage/login/otpScreen");
    };




    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                    <StatusBar style="auto"/>




                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full py-2">
                            <Text className="text-xl tracking-tight dark:text-general font-GoogleSansMedium">Enter phone number?</Text>
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
                            className="bg-general dark:bg-secondaryBlack mb-1 font-medium dark:text-general text-secondaryGray w-full py-4 border border-tertiaryGray   rounded-xl focus:border dark:focus:border-tertiaryGray focus:border-green-600/40"

                        />


                        {error ? (
                            <View className="mb-6 w-full items-start">
                                <Text className="text-sm font-GoogleSansMedium text-red-600">
                                    {error}
                                </Text>
                            </View>
                        ) : <View className="mb-6 w-full items-start">
                            <Text className="text-sm dark:text-tertiaryGray font-GoogleSansRegular">This is the number you provided when you created your account.</Text>
                        </View>}

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
