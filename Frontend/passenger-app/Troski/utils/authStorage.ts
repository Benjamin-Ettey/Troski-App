import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "troski_refresh_token";


export const saveRefreshToken = async (
    refreshToken: string
): Promise<void> => {
    await SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        refreshToken
    );
};


export const getRefreshToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(
        REFRESH_TOKEN_KEY
    );
};



export const deleteRefreshToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(
        REFRESH_TOKEN_KEY
    );
};