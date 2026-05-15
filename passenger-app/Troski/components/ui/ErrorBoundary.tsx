import React from "react";
import {
    View,
    Text,
    Appearance,
    ColorSchemeName,
    TouchableOpacity,
} from "react-native";

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
    colorScheme: ColorSchemeName;
    errorKey: number;

};

export class ErrorBoundary extends React.Component<Props, State> {
    private subscription?: { remove: () => void };

    constructor(props: Props) {
        super(props);

        this.state = {
            hasError: false,
            colorScheme: Appearance.getColorScheme(),
            errorKey: 0,
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {

        console.log("ErrorBoundary caught:", error, info);


    }

    componentDidMount() {
        this.subscription = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({ colorScheme });
        });
    }

    componentWillUnmount() {
        this.subscription?.remove?.();
    }

    handleRetry = () => {

        this.setState((prev) => ({
            hasError: false,
            errorKey: prev.errorKey + 1,
        }));
    };

    render() {
        if (this.state.hasError) {
            const isDark = this.state.colorScheme === "dark";

            return (
                <View
                    className={`flex-1 justify-center items-center px-6 ${
                        isDark ? "bg-black" : "bg-white"
                    }`}
                >
                    <Text className="text-secondaryBlack dark:text-general font-GoogleSansBold text-lg">
                        Something went wrong
                    </Text>

                    <Text
                        className={`text-center mt-2 font-GoogleSansRegular ${
                            isDark ? "text-tertiaryGray" : "text-black"
                        }`}
                    >
                        An unexpected error occurred. Check your internet connection and try again.
                    </Text>

                    <View className="mt-5 w-full justify-center items-center">
                        <TouchableOpacity
                            onPress={this.handleRetry}
                            className="w-[80%] bg-primary py-4 flex justify-center rounded-full items-center"
                        >
                            <Text className="text-secondaryBlack font-GoogleSansBold text-[16px]">
                                Retry
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <React.Fragment key={this.state.errorKey}>
                {this.props.children}
            </React.Fragment>
        );
    }
}