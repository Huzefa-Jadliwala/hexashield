import axios, { AxiosInstance } from "axios";

export const publicClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_WEB_API_URL as string, // Replace with your public API base URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const commandClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_C2_API_URL as string, // Replace with your public API base URL
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

export const privateClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_WEB_API_URL as string, // Replace with your public API base URL
    timeout: 60000,
    // headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    // },
    withCredentials: true
});
