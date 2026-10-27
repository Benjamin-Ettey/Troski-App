import axios from "axios";

export const api = axios.create({
    baseURL: "http://192.168.65.176:5000/api/v1/auth",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 60000,
});