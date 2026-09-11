import {View, Text, TextInput} from 'react-native'
import React from 'react'


type Props = {
    value: string,
    onChangeText: (fun: string) => void
}



const FullNameInput = ({value, onChangeText}: Props) => {

    const error =
        value.length > 0 && value.length <= 3
            ? "Please enter a valid full name"
            : "";

    return (

        <View className="flex-col">

            <View className={`w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl  ${
                error ? "border border-red-600" : "focus:border focus:border-green-600"
            }`}>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={{paddingLeft: 14, textAlign: "left", fontSize: 16}}
                keyboardType="default"
                hitSlop={64}
                autoFocus={true}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 p-3 text-secondaryBlack "
            />
            </View>


            { error?
                <Text
                    style={{paddingLeft: 8}}
                    className="text-xs leading-tight text-red-600 mt-2">{error}
                </Text>
                : null
            }

        </View>

    )
}
export default FullNameInput
