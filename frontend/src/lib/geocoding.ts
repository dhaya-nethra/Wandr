interface BigDataCloudReverseResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
}

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
  return controller.signal;
}

async function reverseViaNominatim(lat: number, lng: number): Promise<string | undefined> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}` +
    '&zoom=18&addressdetails=1';

  const response = await fetch(url, {
    signal: withTimeout(6000),
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-IN,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocoding failed (${response.status})`);
  }

  const data = await response.json();
  return typeof data?.display_name === 'string' && data.display_name.trim()
    ? data.display_name
    : undefined;
}

async function reverseViaBigDataCloud(lat: number, lng: number): Promise<string | undefined> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}` +
    `&longitude=${lng}&localityLanguage=en`;

  const response = await fetch(url, {
    signal: withTimeout(6000),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`BigDataCloud reverse geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as BigDataCloudReverseResponse;
  const parts = [
    data.locality || data.city,
    data.principalSubdivision,
    data.countryName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string | undefined> {
  try {
    return await reverseViaNominatim(lat, lng);
  } catch {
    try {
      return await reverseViaBigDataCloud(lat, lng);
    } catch {
      return undefined;
    }
  }
}
