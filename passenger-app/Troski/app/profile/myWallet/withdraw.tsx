import {View, Text, TextInput, ActivityIndicator, Modal} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const Withdraw = () => {

    const [value, setValue] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const isDisabled = value.length !== 10 || amount.length === 0;
    const [processing, setProcessing] = useState(false);


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

    const handleAmount = (text: string) => {
        const amount = text.replace(/[^0-9]/g, '');
        setAmount(amount);
    };

    const handleNext = () => {
        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }



        // Show modal and start timer
        setProcessing(true);

        const timer = setTimeout(()=>{
            setProcessing(false);
            router.back();
        }, 3000);

        return () => clearTimeout(timer);
    };

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>

                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium">Enter amount number?</Text>
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
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {error}
                            </Text>
                        </View>
                    ) : <View className="mb-6 w-full items-start">
                        <Text className="text-sm font-GoogleSansRegular">This is the number you would like to withdraw your money into.</Text>
                    </View>
                    }

                    <View className="w-full">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium">Amount to be withdrawn?</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={amount}
                        placeholder="GH₵10.50"
                        onChangeText={handleAmount}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        style={{paddingLeft: 16, marginBottom: 24}}
                        className="bg-general mb-1 font-medium text-secondaryGray w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"
                    />

                    {isDisabled?
                        (<DisabledPrimaryButton name="Withdraw" />)
                        :
                        (<PrimaryButton name="Withdraw" disabled={isDisabled} onPress={handleNext}/>)
                    }
                </View>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>

            <Modal visible={processing} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color="white" />

                    <Text
                        style={{ marginTop: 12 }}
                        className="font-GoogleSansMedium text-general"
                    >
                        Processing...
                    </Text>
                </View>
            </Modal>
        </View>
    )
}
export default Withdraw
