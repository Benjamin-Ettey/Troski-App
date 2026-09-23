import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const PrimaryButton = ({name, onPress, disabled}: any) => {

    return (
        <TouchableOpacity
            disabled={disabled}
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            className="w-[80%] bg-primary h-14 flex justify-center rounded-full items-center">
            <Text className="text-secondaryBlack font-GoogleSansBold text-lg leading-tight">{name}</Text>
        </TouchableOpacity>

        )
        }
    export default PrimaryButton
