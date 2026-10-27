import { api } from "./client";

export const registerPassenger = async (data: {
    email: string;
    phoneNumber: string;
    name: string;
    pin: string;
    otpCode: string;
})=> {
    const response = await api.post("/passenger/register", data);

    return response.data;
};


export const loginPassenger = async (data: {
    phoneNumber: string;
    pin: string;
})=> {
    const response = await api.post("/passenger/login", data);

    return response.data;
};


export const requestOTP = async (data: {
    phoneNumber: string;
    purpose: "signup"
})=> {
    const response = await api.post("/passenger/request-otp", data);

    return response.data;
};


export const requestEmailOTP = async (data: {
    name: string;
    email: string;
    purpose: "signup"
})=> {
    const response = await api.post("/passenger/request-email-otp", data);

    return response.data;
};


export const googleSignUp = async (data: {
    idToken: string,
    role: "passenger",
    number: string,
})=> {
    const response = await api.post("/google", data);

    return response.data;
};


export const deletePassenger =  async ()=>{
    await api.delete("/logout");

}


