// Fetches current weather for a city using wttr.in (free, no API key).
// Same tool we used in the CoT + tool calling example.
export async function weatherInfo(cityName) {
  const response = await fetch(
    `https://wttr.in/${encodeURIComponent(cityName)}?format=%C+%t`
  );

  if (!response.ok) {
    throw new Error(`Weather service responded with ${response.status}`);
  }

  const data = await response.text();
  return data.trim();
}
