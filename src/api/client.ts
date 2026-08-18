import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.hvostik.app',
  timeout: 12000,
});
