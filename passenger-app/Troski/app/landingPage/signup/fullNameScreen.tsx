import {View, Text, TextInput, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const FullnameScreen = () => {
    const [fullName, setFullName] = useState("")
    const isDisabled = fullName.trim().length <= 3;
    const setName = useAppStore((state)=>state.setName)

    const handleFullName = (text: string)=>{
        setFullName(text)

        if (text.length===0) return
    }

    const handleCreateAccount = () => {
        if (fullName.trim().length <= 3) return;

        setName(fullName)
        router.push("/landingPage/signup/otpScreen");
    };
    return (

        <View className="flex-1 dark:bg-secondaryBlack bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                    <StatusBar style="auto"/>




                    <View className="w-full flex-1 flex items-center px-6">
                        <View className="w-full py-2">
                            <Text className="text-xl leading-6 font-GoogleSansMedium dark:text-general tracking-tight">What&apos;s your full name?</Text>
                        </View>

                        <TextInput
                            value={fullName}
                            autoCorrect={false}
                            autoCapitalize="none"
                            textContentType="name"
                            autoComplete="name"
                            onChangeText={handleFullName}
                            keyboardType="default"
                            autoFocus={true}
                            style={{paddingLeft: 16}}
                            className="bg-general mb-1 dark:bg-secondaryBlack dark:text-general dark:focus:border-tertiaryGray font-GoogleSansMedium text-secondaryBlack w-full h-14 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                        />
                        <View className="mb-8 w-full items-start">
                            <Text className="text-sm leading-4 font-GoogleSansRegular dark:text-tertiaryGray">This shows on your Troski profile.</Text>
                            <Text className="text-sm leading-4 font-GoogleSansRegular dark:text-tertiaryGray">Your full name should be at least 3 characters.</Text>

                        </View>

                        <View style={{height: 1}} className="w-full bg-tertiaryGray mb-4"/>

                        <View className="w-full mb-8">
                            <View className="flex flex-col mb-4">
                                <Text className="text-sm leading-4 text-nowrap mb-1 font-GoogleSansRegular dark:text-tertiaryGray">By tapping on &quot;Create account&quot;, you agree to Troski&apos;s Terms of Use.</Text>
                                <TouchableOpacity><Text className="font-GoogleSansMedium text-red-600 text-sm leading-4 tracking-tighter">Terms of Use.</Text></TouchableOpacity>
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-sm leading-4 text-nowrap mb-1 font-GoogleSansRegular dark:text-tertiaryGray">By tapping on &quot;Create account&quot;, you agree to Troski&apos;s Privacy policy</Text>
                                <TouchableOpacity><Text className="font-GoogleSansMedium text-sm leading-4 text-red-600 tracking-tighter">Privacy policy.</Text></TouchableOpacity>
                            </View>
                        </View>


                        {isDisabled?
                            (<DisabledPrimaryButton name="Create account" />)
                            :
                            (<PrimaryButton name="Create account" disabled={isDisabled} onPress={handleCreateAccount}/>)

                        }

                    </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default FullnameScreen
