import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";
import React from "react";

type Props = {
    value: string;
    onChangeText: (text: string) => void;

    placeholder: string;

    error?: string;

    keyboardType?: KeyboardTypeOptions;

    autoComplete?: any;

    autoFocus?: boolean;
};

const VerificationInput = ({
                               value,
                               onChangeText,
                               placeholder,
                               error,
                               keyboardType = "default",
                               autoComplete,
                               autoFocus = false,
                           }: Props) => {
    return (
        <View className="flex-col">
            <View
                className={`w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl px-4 ${
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
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    style={{ paddingLeft: 4 }}
                    className="text-base text-secondaryBlack w-full h-full"
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

export default VerificationInput;