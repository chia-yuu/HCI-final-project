import axios from "axios";

const api = axios.create({
//   baseURL: process.env.REACT_APP_API || "http://localhost:8000",
    // baseURL: "http://backend:8000",
    baseURL: "",
});

export default api;
