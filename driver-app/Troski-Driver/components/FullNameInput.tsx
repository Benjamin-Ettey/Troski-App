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

            <View className={`w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl px-4 ${
                error ? "border border-red-600" : "focus:border focus:border-green-600"
            }`}>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={{paddingLeft: 4, }}
                keyboardType="default"
                autoComplete="name"
                autoFocus={true}
                placeholder="Enter your full name"
                className="text-base text-secondaryBlack w-full h-full flex-row justify-start items-center "
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
export default FullNameInput
