import {Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const SearchBarButton = ({name, onPress} : any) => {

    const { colorScheme } = useColorScheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            className=" w-full bg-tertiaryWhite dark:bg-secondaryGray/40 h-14 px-6 flex flex-row gap-3 justify-start rounded-full items-center">
            <Ionicons name="search" size={20} color={colorScheme === "dark"? "#f0f0f0": "#444444"} />
            <Text className="text-secondaryGray dark:text-tertiaryWhite font-GoogleSansMedium text-lg leading-5">{name}</Text>
        </TouchableOpacity>
    )
}
export default SearchBarButton
