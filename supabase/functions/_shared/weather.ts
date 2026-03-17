interface RioWeather {
  currentTemp: number;
  currentHumidity: number;
  maxTempNext7Days: number;
  season: "verao" | "outono" | "inverno" | "primavera";
  seasonLabel: string;
}

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current=temperature_2m,relative_humidity_2m,precipitation&daily=temperature_2m_max&timezone=America/Sao_Paulo&forecast_days=7";

function getSeason(month: number): { season: RioWeather["season"]; seasonLabel: string } {
  if (month >= 12 || month <= 2) return { season: "verao", seasonLabel: "verão" };
  if (month >= 3 && month <= 5) return { season: "outono", seasonLabel: "outono" };
  if (month >= 6 && month <= 8) return { season: "inverno", seasonLabel: "inverno" };
  return { season: "primavera", seasonLabel: "primavera" };
}

const FALLBACK: RioWeather = {
  currentTemp: 28,
  currentHumidity: 75,
  maxTempNext7Days: 34,
  season: "verao",
  seasonLabel: "verão",
};

export async function getRioWeather(): Promise<RioWeather> {
  try {
    const res = await fetch(OPEN_METEO_URL);
    if (!res.ok) {
      console.error("Open-Meteo error:", res.status);
      return { ...FALLBACK, ...getSeason(new Date().getMonth() + 1) };
    }

    const data = await res.json();
    const currentTemp = data.current?.temperature_2m ?? FALLBACK.currentTemp;
    const currentHumidity = data.current?.relative_humidity_2m ?? FALLBACK.currentHumidity;
    const dailyMaxTemps: number[] = data.daily?.temperature_2m_max ?? [];
    const maxTempNext7Days = dailyMaxTemps.length > 0 ? Math.max(...dailyMaxTemps) : FALLBACK.maxTempNext7Days;

    const now = new Date();
    const month = now.getMonth() + 1;
    const { season, seasonLabel } = getSeason(month);

    return { currentTemp, currentHumidity, maxTempNext7Days, season, seasonLabel };
  } catch (err) {
    console.error("Failed to fetch weather:", err);
    return { ...FALLBACK, ...getSeason(new Date().getMonth() + 1) };
  }
}
