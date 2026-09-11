import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";
import React from "react";

type Props = {
    value: string;
    onChangeText: (text: string) => void;

    placeholder: string;

    error?: string;

    keyboardType?: KeyboardTypeOptions;


    autoFocus?: boolean;
};

const VerificationInput = ({
                               value,
                               onChangeText,
                               placeholder,
                               error,
                               keyboardType = "default",
                               autoFocus = false,
                           }: Props) => {
    return (
        <View className="flex-col">
            <View
                className={`w-full h-14 bg-tertiaryGray/10  flex-row items-center rounded-2xl  ${
                    error
                        ? "border border-red-600"
                        : "border border-transparent focus:border-green-600"
                }`}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    keyboardType={keyboardType}
                    autoFocus={autoFocus}
                    style={{paddingLeft: 14, textAlign: "left", fontSize: 16}}
                    className="text-secondaryBlack p-3 flex-1 "
                    placeholderTextColor="#9CA3AF"

                />
            </View>

            {error ? (
                <Text
                    style={{ paddingLeft: 8 }}
                    className="text-xs leading-tight text-red-600 mt-2"
                >
                    {error}
                </Text>
            ) : null}
        </View>
    );
};

export default VerificationInput;