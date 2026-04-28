import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const PrimaryButton = ({name, onPress}) => {

    return (
            <TouchableOpacity onPress={onPress} className=" w-[80%] bg-primary py-5 flex justify-center rounded-full items-center">
                <Text className="text-black font-bold text-[16px]">{name}</Text>
            </TouchableOpacity>

    )
}
export default PrimaryButton
