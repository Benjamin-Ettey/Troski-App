import { Text, TouchableOpacity} from 'react-native'
import React from 'react'

const DisabledPrimaryButton = ({name}: any) => {
    return (
        <TouchableOpacity
            disabled={true}
            style={{opacity: 0.3}}
            className=" w-[80%] bg-primary py-4 flex justify-center rounded-full items-center">
            <Text className="text-secondaryBlack font-GoogleSansBold text-[16px]">{name}</Text>
        </TouchableOpacity>
    )
}
export default DisabledPrimaryButton
