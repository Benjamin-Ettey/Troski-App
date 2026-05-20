import {View, Text} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import {useColorScheme} from "nativewind";

const ConfirmPinScreen = () => {
    const {colorScheme} = useColorScheme();

    const pin = useAppStore((state) => state.pin);

    const [value, setValue] = useState("");

    const disable = value.length !== 6 || value !== pin;

    const handleNext = () => {
        if (disable) return;

        router.push("/landingPage/signup/fullNameScreen");
    };

    const handleOTP = (text: string) => {
        setValue(text);
    };

    return (
        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                    <StatusBar style="auto"/>


                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full mb-4">
                            <Text className="text-2xl leading-7 dark:text-general font-GoogleSansMedium tracking-tight">Verify 6 digit pin</Text>
                            <Text className="text-sm leading-4 dark:text-tertiaryWhite font-GoogleSansRegular">Re-enter 6 digit pin code</Text>

                        </View>

                        <OtpInput
                            placeholder="******"
                            numberOfDigits={6}
                            autoFocus={true}
                            onTextChange={handleOTP}
                            type="numeric"
                            textInputProps={{
                                placeholderTextColor: colorScheme === "dark"? "#ffffff": "#000000",
                            }}
                            textProps={{
                                style: {color: colorScheme === "dark"? "#ffffff": "#000000"}
                            }}

                        />
                        <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                            <View className="flex flex-row justify-start w-full ">
                                <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                                <Text style={{flexShrink: 1}}  className="text-sm leading-4 mb-1 dark:text-tertiaryGray font-GoogleSansRegular">Do not share this PIN code with anyone as this will be used to access your wallet transactions. </Text>
                            </View>

                            <View className="flex flex-row justify-start w-full">
                                <Ionicons name="pin" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                                <Text className="text-sm leading-4 mb-1 dark:text-tertiaryGray font-GoogleSansRegular">Use a pin you can easily remember.</Text>
                            </View>
                        </View>


                        {disable?
                            (<DisabledPrimaryButton name="Next" />)
                            :
                            (<PrimaryButton name="Next" disabled={disable} onPress={handleNext}/>)

                        }
                    </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default ConfirmPinScreen
