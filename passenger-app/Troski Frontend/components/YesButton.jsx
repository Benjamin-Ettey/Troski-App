import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const YesButton = ({name, onPress}) => {
    return (
            <TouchableOpacity onPress={onPress} className=" w-[40%] bg-primary py-4 px-2 flex justify-center rounded-full items-center">
                <Text className="text-black font-bold text-[16px]">{name}</Text>
            </TouchableOpacity>

    )
}
export default YesButton
