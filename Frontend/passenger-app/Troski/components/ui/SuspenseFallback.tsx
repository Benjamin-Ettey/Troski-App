import { View, Text } from "react-native";
import LottieView from "lottie-react-native";

export default function SuspenseFallback() {
    return (
        <View className="flex-1 justify-center items-center">
            <LottieView
                source={require("../../assets/video/loadingdots.json")}
                autoPlay
                loop
                style={{
                    width: 300,
                    height: 300,
                }}
            />

            <Text className="mt-4 text-secondaryBlack dark:text-tertiaryWhite font-GoogleSansRegular flex-shrink">
                Hang tight — we’re preparing your ride...
            </Text>
        </View>
    );
}