import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {useRouter} from "expo-router";

const NotFound = () => {
    const router = useRouter();

    return (
        <View className="flex-1 justify-center items-center px-6 bg-general gap-2 ">
            <Text className="text-2xl leading-tight font-GoogleSansBold text-secondaryBlack">
                Page not found
            </Text>

            <Text className="text-center text-sm leading-tight font-GoogleSansRegular text-secondaryGray">
                The screen you’re looking for doesn’t exist.
            </Text>

            <TouchableOpacity
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/");
                    }
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                className="mt-3 bg-primary rounded-full"
            >
                <Text className="text-secondaryBlack text-base leading-tight font-GoogleSansBold">
                    Go back
                </Text>
            </TouchableOpacity>
        </View>
    )
}
export default NotFound
