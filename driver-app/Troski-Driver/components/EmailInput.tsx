import {View, Text, TextInput} from 'react-native'
import React, {useState} from 'react'


type Props = {
    value: string,
    onChangeText: (fun: string) => void
}



const EmailInput = ({value, onChangeText}: Props) => {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const error =
        value.length > 0 && !emailRegex.test(value)
            ? "Please enter a valid email address"
            : "";

    return (

        <View className="flex-col">

            <View className={`w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl px-4 ${
                error ? "border border-red-600" : "focus:border focus:border-green-600"
            }`}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={{paddingLeft: 4, textAlign: "left", fontSize: 16}}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                autoFocus={false}
                placeholder="Enter your email address"
                className="text-secondaryBlack w-full "
            />
            </View>

            { error?
                <Text
                    style={{paddingLeft: 8}}
                    className="text-xs leading-none text-red-600 mt-2">{error}
                </Text>
                : null
            }

        </View>

    )
}
export default EmailInput
