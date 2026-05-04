import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const PrimaryButton = ({name, onPress, disabled}) => {

    return (
        <TouchableOpacity
            disabled={disabled}
            onPress={onPress}
            className=" w-[80%] bg-primary py-4 flex justify-center rounded-full items-center">
            <Text className="text-secondaryBlack font-GoogleSansBold text-[16px]">{name}</Text>
        </TouchableOpacity>

        )
        }
    export default PrimaryButton
