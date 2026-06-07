import { View, Text, TextInput } from "react-native";
import React from "react";

type Props = {
    value: string;
    onChangeText: (fun: string) => void;
};

const PhoneNumberInput = ({ value, onChangeText }: Props) => {
    const error =
        value.length > 0 && value.length < 9
            ? "Please enter a valid phone number"
            : "";

    return (
        <View className="flex-col">
            <View
                className={`w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl px-4 ${
                    error ? "border border-red-600" : "focus:border focus:border-green-600"
                }`}
            >
                {/* Ghana Code */}
                <View className="flex-row items-center pr-3 mr-3 border-r border-gray-300">
                    <Text className="text-lg font-GoogleSansRegular text-black">
                        🇬🇭 +233
                    </Text>
                </View>

                {/* Phone Input */}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={{paddingLeft: 4, textAlign: "left", fontSize: 16}}
                    keyboardType="phone-pad"
                    autoFocus={false}
                    placeholder="50 352 4779"
                    className="  text-secondaryBlack w-full"
                    placeholderTextColor="#9CA3AF"
                    textAlignVertical="center"
                    maxLength={9}
                />
            </View>

            {error ? (
                <Text
                    style={{ paddingLeft: 8 }}
                    className="text-xs leading-none text-red-600 mt-2"
                >
                    {error}
                </Text>
            ) : null}
        </View>
    );
};

export default PhoneNumberInput;