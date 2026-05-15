import {Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const SearchBarButton = ({name, onPress} : any) => {

    const { colorScheme } = useColorScheme();
    return (
        <TouchableOpacity
            style={{height: 48}}
            onPress={onPress}
            className=" w-full bg-tertiaryWhite dark:bg-secondaryGray/40 py-2 px-6 flex flex-row gap-4 justify-start rounded-full items-center">
            <Ionicons name="search" size={18} color={colorScheme === "dark"? "#f0f0f0": "gray"} />
            <Text className="text-secondaryGray dark:text-tertiaryWhite font-GoogleSansRegular text-[16px]">{name}</Text>
        </TouchableOpacity>
    )
}
export default SearchBarButton
