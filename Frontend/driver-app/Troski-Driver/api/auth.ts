import { api } from "./client";

export const registerDriver = async (data: {
    email: string;
    phone: number;
    name: string;
    pin: number;
})=> {
    const response = await api.post("/driver/register", data);

    return response.data;
};


export const loginDriver = async (data: {
    phone: number;
    pin: number;
})=> {
    const response = await api.post("/driver/login", data);

    return response.data;
};


export const requestOTP = async (data: {
    phone: number;
    purpose: "signup"
})=> {
    const response = await api.post("/driver/request-otp", data);

    return response.data;
};


export const requestEmailOTP = async (data: {
    email: string;
    purpose: "signup"
})=> {
    const response = await api.post("/driver/request-otp", data);

    return response.data;
};


export const googleSignUp = async (data: {
    idToken: string,
    role: "driver",
    number: string,
})=> {
    const response = await api.post("/google", data);

    return response.data;
};


export const deletePassenger =  async ()=>{
    await api.delete("/logout");

}

