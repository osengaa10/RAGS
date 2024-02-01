
import axios from 'axios'

export const axiosBaseUrl = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
    // baseURL: "http://localhost:8000/api"
  });

