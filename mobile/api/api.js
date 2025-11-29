import axios from "axios";
import { API_URL } from "@env";

const api = axios.create({
  baseURL: API_URL,  // 要改成你自己的電腦 IP！！！
});

export default api;
