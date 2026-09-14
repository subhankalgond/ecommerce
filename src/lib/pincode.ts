/**
 * Pincode → delivery estimate. Fully offline: a tiny deterministic model
 * good enough for a demo store (no external API, no keys, no rate limits).
 */

const METRO_PREFIXES = new Set([
  "11", // Delhi
  "40", // Mumbai
  "56", // Bangalore
  "60", // Chennai (60x)
  "70", // Kolkata
  "50", // Hyderabad
  "41", // Pune
  "38", // Ahmedabad
]);

export interface PincodeResult {
  ok: boolean;
  city?: string;
  state?: string;
  days?: number;
  eta?: string;
  codAvailable?: boolean;
  error?: string;
}

/** Deterministic pseudo-random from the pincode so answers are stable */
function seedFrom(pin: string): number {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 31 + pin.charCodeAt(i)) % 997;
  }
  return h;
}

const STATES: [prefix: string, city: string, state: string][] = [
  ["11", "New Delhi", "Delhi"],
  ["12", "Gurugram", "Haryana"],
  ["14", "Ludhiana", "Punjab"],
  ["16", "Chandigarh", "Chandigarh"],
  ["20", "Noida", "Uttar Pradesh"],
  ["22", "Lucknow", "Uttar Pradesh"],
  ["24", "Dehradun", "Uttarakhand"],
  ["30", "Jaipur", "Rajasthan"],
  ["32", "Bikaner", "Rajasthan"],
  ["36", "Ahmedabad", "Gujarat"],
  ["38", "Ahmedabad", "Gujarat"],
  ["39", "Surat", "Gujarat"],
  ["40", "Mumbai", "Maharashtra"],
  ["41", "Pune", "Maharashtra"],
  ["44", "Nagpur", "Maharashtra"],
  ["46", "Bhopal", "Madhya Pradesh"],
  ["49", "Raipur", "Chhattisgarh"],
  ["50", "Hyderabad", "Telangana"],
  ["52", "Vijayawada", "Andhra Pradesh"],
  ["56", "Bengaluru", "Karnataka"],
  ["57", "Mysuru", "Karnataka"],
  ["58", "Hubballi", "Karnataka"],
  ["60", "Chennai", "Tamil Nadu"],
  ["62", "Madurai", "Tamil Nadu"],
  ["64", "Coimbatore", "Tamil Nadu"],
  ["68", "Kochi", "Kerala"],
  ["70", "Kolkata", "West Bengal"],
  ["73", "Siliguri", "West Bengal"],
  ["75", "Bhubaneswar", "Odisha"],
  ["78", "Guwahati", "Assam"],
  ["80", "Patna", "Bihar"],
  ["82", "Ranchi", "Jharkhand"],
  ["90", "Shillong", "Meghalaya"],
];

export function checkPincode(raw: string): PincodeResult {
  const pin = raw.trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return { ok: false, error: "Enter a valid 6-digit Indian pincode." };
  }
  const match = STATES.find(([prefix]) => pin.startsWith(prefix));
  const city = match?.[1] ?? "Your area";
  const state = match?.[2] ?? "India";

  const h = seedFrom(pin);
  const metro = METRO_PREFIXES.has(pin.slice(0, 2));
  const days = metro ? 1 + (h % 2) : 2 + (h % 4); // metros 1-2 days, else 2-5
  const eta = new Date(Date.now() + days * 86400000).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const codAvailable = h % 10 !== 0; // ~90% of pincodes support COD

  return { ok: true, city, state, days, eta, codAvailable };
}
