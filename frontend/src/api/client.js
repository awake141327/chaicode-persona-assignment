import axios from "axios";

// Single axios instance for all backend calls.
// Add new API methods here as the backend grows.
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api",
});

export async function getWeather(city) {
  const response = await apiClient.get(`/weather/${encodeURIComponent(city)}`);
  return response.data;
}

export default apiClient;
