import { Text, TouchableOpacity} from 'react-native'
import React from 'react'

const SecondaryButton = ({onPress, title} : any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className=" w-[80%] bg-tertiaryWhite h-14 flex justify-center rounded-full items-center">
            <Text className="text-black font-GoogleSansBold text-lg leading-5">{title}</Text>
        </TouchableOpacity>
    )
}
export default SecondaryButton
