import { Text, TouchableOpacity} from 'react-native'
import React from 'react'

const DisabledPrimaryButton = ({name}: any) => {
    return (
        <TouchableOpacity
            disabled={true}
            className="w-[80%] bg-primary h-14 flex justify-center rounded-full items-center opacity-30">
            <Text className="text-secondaryBlack font-GoogleSansBold text-base leading-tight">{name}</Text>
        </TouchableOpacity>
    )
}
export default DisabledPrimaryButton
