/**
 * Reverse geocoding utility using LocationIQ API.
 * Endpoint: https://us1.locationiq.com/v1/reverse (or eu1)
 * Converts coordinates to formatted street address.
 * Best-effort: catches all errors and returns null on failure without throwing.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey =
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATIONIQ_ACCESS_TOKEN;

  if (!apiKey || apiKey.startsWith("pk.placeholder") || apiKey.includes("your_")) {
    console.warn(
      "[Geocode] LocationIQ API key not set or is placeholder in environment variables (LOCATIONIQ_API_KEY)."
    );
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout guard

  try {
    const region = process.env.LOCATIONIQ_REGION || "us1";
    const url = new URL(`https://${region}.locationiq.com/v1/reverse`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lng.toString());
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("normalizeaddress", "1");

    console.info(
      `[Geocode] Dispatching LocationIQ reverse geocode request for coordinates: [${lat.toFixed(6)}, ${lng.toFixed(6)}] (region: ${region})...`
    );

    const startTime = performance.now();
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = (performance.now() - startTime).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[Geocode] LocationIQ request failed (${durationMs}ms) with status ${response.status}: ${errorText}`
      );
      return null;
    }

    const data = await response.json();

    if (data && typeof data.display_name === "string") {
      console.info(
        `[Geocode] LocationIQ successfully resolved address in ${durationMs}ms:`,
        {
          coordinates: [lat, lng],
          displayName: data.display_name,
          addressDetails: data.address || undefined,
        }
      );
      return data.display_name;
    }

    console.warn(
      `[Geocode] LocationIQ responded in ${durationMs}ms but returned no display_name for [${lat}, ${lng}]:`,
      data
    );
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(
      "[Geocode] LocationIQ geocoding error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
