import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {useRouter} from "expo-router";

const NotFound = () => {
    const router = useRouter();

    return (
        <View className="flex-1 justify-center items-center px-6 bg-general gap-2 dark:bg-secondaryBlack">
            <Text className="text-2xl font-GoogleSansBold text-secondaryBlack dark:text-general">
                Page not found
            </Text>

            <Text className="text-center text-sm font-GoogleSansRegular text-secondaryGray dark:text-tertiaryGray">
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
                <Text className="text-secondaryBlack text-base leading-none font-GoogleSansBold">
                    Go back
                </Text>
            </TouchableOpacity>
        </View>
    )
}
export default NotFound
