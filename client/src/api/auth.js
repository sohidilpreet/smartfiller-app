import axios from 'axios';
import { BASE_URL } from './config';

const API = axios.create({
  baseURL: `${BASE_URL}/api/auth`,
});

export const register = (data) => API.post('/register', data);
export const login = (data) => API.post('/login', data);
export const getMe = (token) =>
  API.get('/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
