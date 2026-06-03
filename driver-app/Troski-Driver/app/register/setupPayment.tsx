import {View, Text, Modal} from 'react-native'
import React, {useState} from 'react'
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import VerificationInput from "@/components/VerificationInput";
import { useAppStore } from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import LottieView from "lottie-react-native";

const SetupPayment = () => {

    const router = useRouter();
    const [ showLoading, setShowLoading ] = useState(false);


    const mobilemoneynumber = useAppStore((state) => state.mobilemoneynumber);
    const bankaccountnumber = useAppStore((state) => state.bankaccountnumber);
    const accountname = useAppStore((state) => state.accountname);

    const setMobileMoneyNumber = useAppStore((state) => state.setMobileMoneyNumber);
    const setBankAccountNumber = useAppStore((state) => state.setBankAccountNumber);
    const setAccountName = useAppStore((state) => state.setAccountName);

    const isDisabled =
        !mobilemoneynumber ||
        mobilemoneynumber.trim().length < 10;

    const handleSetupPayment = () => {
        setShowLoading(true);

        setTimeout(() => {
            setShowLoading(false);
            router.push("/homepage");
        }, 3000);
    };

    return (
        <View className="flex-1 bg-general">

            <KeyboardAwareScrollView
                bottomOffset={200}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >

                <StatusBar style="dark" />

                <View className="w-full flex-1 flex items-center px-6">

                    {/* HEADER */}
                    <View className="w-full py-6 flex-col gap-2">
                        <Text className="text-3xl leading-none tracking-tighter text-secondaryBlack font-GoogleSansMedium">
                            Setup payment
                        </Text>

                        <Text className="text-sm leading-none text-secondaryGray font-GoogleSansRegular">
                            Add your payment details to receive earnings from rides.
                        </Text>
                    </View>

                    {/* FORM */}
                    <View className="w-full flex flex-col justify-center items-start gap-6 pt-8">

                        {/* Mobile Money */}
                        <View className="w-full gap-2">

                            <View className="w-full flex flex-row items-center gap-2">
                                <Text className="text-base leading-none tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                    Mobile money number
                                </Text>
                                <Ionicons name="star" size={6} color="red" />
                            </View>

                            <VerificationInput
                                value={mobilemoneynumber}
                                onChangeText={setMobileMoneyNumber}
                                placeholder="Enter mobile money number"
                                keyboardType="number-pad"
                            />

                        </View>

                        {/* Bank Account (Optional) */}
                        <View className="w-full gap-2">

                            <View className="w-full flex flex-row items-center gap-2">
                                <Text className="text-base leading-none tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                    Bank account number
                                </Text>
                                <Text className="text-xs text-secondaryGray font-GoogleSansRegular">
                                    (Optional)
                                </Text>
                            </View>

                            <VerificationInput
                                value={bankaccountnumber}
                                onChangeText={setBankAccountNumber}
                                placeholder="Enter bank account number"
                                keyboardType="number-pad"
                            />

                        </View>

                        {/* Account Name (Optional) */}
                        <View className="w-full gap-2">

                            <View className="w-full flex flex-row items-center gap-2">
                                <Text className="text-base leading-none tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                    Account name
                                </Text>
                                <Text className="text-xs text-secondaryGray font-GoogleSansRegular">
                                    (Optional)
                                </Text>
                            </View>

                            <VerificationInput
                                value={accountname}
                                onChangeText={setAccountName}
                                placeholder="Enter account name"
                            />

                        </View>

                        {/* BUTTON */}
                        <View className="w-full flex justify-center mt-4 gap-2 items-center">

                            {isDisabled ?
                                <DisabledPrimaryButton
                                    name="Continue"
                                />
                                :
                                <PrimaryButton
                                    name="Continue"
                                    onPress={handleSetupPayment}
                                    disabled={isDisabled}
                                />
                            }

                        </View>

                    </View>

                </View>

                <Modal visible={showLoading} animationType="fade">
                    <View className="flex-1 flex-col w-full justify-center items-center bg-general">
                        <LottieView
                            source={require("../../assets/video/loading.json")}
                            autoPlay
                            loop
                            style={{
                                width: 300,
                                height: 300,
                            }}
                        />

                    </View>
                </Modal>

            </KeyboardAwareScrollView>
        </View>
    )
}

export default SetupPayment