import { api } from "./client";

export const registerPassenger = async (data: {
    email: string;
    phone: number;
    name: string;
    pin: number;
})=> {
    const response = await api.post("/passenger/register", data);

    return response.data;
};


export const loginPassenger = async (data: {
    phone: number;
    pin: number;
})=> {
    const response = await api.post("/passenger/login", data);

    return response.data;
};


export const requestOTP = async (data: {
    phone: number;
    purpose: "signup"
})=> {
    const response = await api.post("/passenger/request-otp", data);

    return response.data;
};


export const requestEmailOTP = async (data: {
    email: string;
    purpose: "signup"
})=> {
    const response = await api.post("/passenger/request-otp", data);

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


