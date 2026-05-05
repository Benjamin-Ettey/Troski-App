import {Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";

const SearchBarButton = ({name, onPress} : any) => {
    return (
        <TouchableOpacity
            style={{height: 48}}
            onPress={onPress}
            className=" w-full bg-tertiaryWhite py-2 px-6 flex flex-row gap-4 justify-start rounded-full items-center">
            <Ionicons name="search" size={18} color="gray" />
            <Text className="text-secondaryGray font-GoogleSansRegular text-[16px]">{name}</Text>
        </TouchableOpacity>
    )
}
export default SearchBarButton
