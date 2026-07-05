import { weatherInfo } from "../services/weather.service.js";

// GET /api/weather/:city
export async function getWeatherByCity(req, res) {
  const { city } = req.params;

  if (!city || !city.trim()) {
    return res.status(400).json({ error: "City name is required" });
  }

  try {
    const weather = await weatherInfo(city.trim());
    return res.json({ city: city.trim(), weather });
  } catch (error) {
    return res
      .status(502)
      .json({ error: `Could not fetch weather for ${city}: ${error.message}` });
  }
}
