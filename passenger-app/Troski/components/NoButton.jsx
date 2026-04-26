import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const NoButton = ({name, onPress}) => {
    return (
            <TouchableOpacity onPress={onPress} className=" w-[40%]  border-2 border-primary py-4 flex justify-center rounded-full items-center">
                <Text className="text-black font-bold text-[16px]">{name}</Text>
            </TouchableOpacity>

    )
}
export default NoButton
