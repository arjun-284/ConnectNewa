import axios from 'axios';

export const api = axios.create({
  baseURL: '/api', // proxied to http://localhost:5000
});
