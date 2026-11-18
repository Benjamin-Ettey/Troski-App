import axios from "axios";

export const api = axios.create({
    baseURL: "http://api/v1/auth",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 60000,
});