import {View, Text} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const Index = () => {

    const pin = useAppStore((state)=> state.pin)
    const [disable, setDisable] = useState(true);
    const [value, setValue] = useState("");

    const handleNext = ()=>{

        if (value.length !== 6) return
        router.push("/profile/settings/changePinCode/newPinCode")
    }

    const handleOTP = (text: any) => {
        setValue(text);

        if (text.length === 6 && pin === text) {
            setDisable(false);
        } else {
            setDisable(true);
        }
    };

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>


                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl font-GoogleSansMedium tracking-tight">Enter your 6-digit PIN</Text>
                        <Text className="text-sm font-GoogleSansRegular">Please enter your current PIN to continue.</Text>

                    </View>

                    <OtpInput
                        placeholder="******"
                        numberOfDigits={6}
                        autoFocus={true}
                        onTextChange={handleOTP}
                        type="numeric"


                    />
                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                        <View className="flex flex-row justify-start w-full ">
                            <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                            <Text style={{flexShrink: 1}}  className="text-sm mb-1 font-GoogleSansRegular">Never share your PIN with anyone. It is used to authorize access to your wallet and transactions.</Text>
                        </View>


                    </View>

                    {disable?
                        (<DisabledPrimaryButton name="Change phone number" />)
                        :
                        (<PrimaryButton name="Change phone number" disabled={disable} onPress={handleNext}/>)

                    }
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default Index
