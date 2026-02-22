// Maps common airline names to their logo URLs
// Uses a combination of known IATA codes and logo CDN

const AIRLINE_LOGOS: Record<string, string> = {
  // Brazilian Airlines
  'latam': 'https://images.kiwi.com/airlines/64/JJ.png',
  'gol': 'https://images.kiwi.com/airlines/64/G3.png',
  'azul': 'https://images.kiwi.com/airlines/64/AD.png',
  'voepass': 'https://images.kiwi.com/airlines/64/2Z.png',
  'avianca': 'https://images.kiwi.com/airlines/64/AV.png',
  
  // International Airlines
  'american airlines': 'https://images.kiwi.com/airlines/64/AA.png',
  'united': 'https://images.kiwi.com/airlines/64/UA.png',
  'united airlines': 'https://images.kiwi.com/airlines/64/UA.png',
  'delta': 'https://images.kiwi.com/airlines/64/DL.png',
  'delta airlines': 'https://images.kiwi.com/airlines/64/DL.png',
  'air france': 'https://images.kiwi.com/airlines/64/AF.png',
  'british airways': 'https://images.kiwi.com/airlines/64/BA.png',
  'lufthansa': 'https://images.kiwi.com/airlines/64/LH.png',
  'emirates': 'https://images.kiwi.com/airlines/64/EK.png',
  'qatar airways': 'https://images.kiwi.com/airlines/64/QR.png',
  'qatar': 'https://images.kiwi.com/airlines/64/QR.png',
  'turkish airlines': 'https://images.kiwi.com/airlines/64/TK.png',
  'tap': 'https://images.kiwi.com/airlines/64/TP.png',
  'tap portugal': 'https://images.kiwi.com/airlines/64/TP.png',
  'iberia': 'https://images.kiwi.com/airlines/64/IB.png',
  'klm': 'https://images.kiwi.com/airlines/64/KL.png',
  'swiss': 'https://images.kiwi.com/airlines/64/LX.png',
  'copa airlines': 'https://images.kiwi.com/airlines/64/CM.png',
  'copa': 'https://images.kiwi.com/airlines/64/CM.png',
  'aerolineas argentinas': 'https://images.kiwi.com/airlines/64/AR.png',
  'ethiopian airlines': 'https://images.kiwi.com/airlines/64/ET.png',
  'singapore airlines': 'https://images.kiwi.com/airlines/64/SQ.png',
  'cathay pacific': 'https://images.kiwi.com/airlines/64/CX.png',
  'japan airlines': 'https://images.kiwi.com/airlines/64/JL.png',
  'ana': 'https://images.kiwi.com/airlines/64/NH.png',
  'korean air': 'https://images.kiwi.com/airlines/64/KE.png',
  'ryanair': 'https://images.kiwi.com/airlines/64/FR.png',
  'easyjet': 'https://images.kiwi.com/airlines/64/U2.png',
  'southwest': 'https://images.kiwi.com/airlines/64/WN.png',
  'jetblue': 'https://images.kiwi.com/airlines/64/B6.png',
  'air canada': 'https://images.kiwi.com/airlines/64/AC.png',
  'qantas': 'https://images.kiwi.com/airlines/64/QF.png',
  'etihad': 'https://images.kiwi.com/airlines/64/EY.png',
  'condor': 'https://images.kiwi.com/airlines/64/DE.png',
  'volaris': 'https://images.kiwi.com/airlines/64/Y4.png',
  'aeromexico': 'https://images.kiwi.com/airlines/64/AM.png',
  'jetsmart': 'https://images.kiwi.com/airlines/64/JA.png',
  'flybondi': 'https://images.kiwi.com/airlines/64/FO.png',
};

// IATA code mapping for direct code input
const IATA_CODES: Record<string, string> = {
  'JJ': 'https://images.kiwi.com/airlines/64/JJ.png',
  'LA': 'https://images.kiwi.com/airlines/64/LA.png',
  'G3': 'https://images.kiwi.com/airlines/64/G3.png',
  'AD': 'https://images.kiwi.com/airlines/64/AD.png',
  'AA': 'https://images.kiwi.com/airlines/64/AA.png',
  'UA': 'https://images.kiwi.com/airlines/64/UA.png',
  'DL': 'https://images.kiwi.com/airlines/64/DL.png',
  'AF': 'https://images.kiwi.com/airlines/64/AF.png',
  'BA': 'https://images.kiwi.com/airlines/64/BA.png',
  'LH': 'https://images.kiwi.com/airlines/64/LH.png',
  'EK': 'https://images.kiwi.com/airlines/64/EK.png',
  'QR': 'https://images.kiwi.com/airlines/64/QR.png',
  'TK': 'https://images.kiwi.com/airlines/64/TK.png',
  'TP': 'https://images.kiwi.com/airlines/64/TP.png',
  'IB': 'https://images.kiwi.com/airlines/64/IB.png',
  'KL': 'https://images.kiwi.com/airlines/64/KL.png',
  'AV': 'https://images.kiwi.com/airlines/64/AV.png',
  'CM': 'https://images.kiwi.com/airlines/64/CM.png',
};

export const getAirlineLogo = (airlineName: string): string | null => {
  if (!airlineName) return null;
  
  const normalized = airlineName.trim().toLowerCase();
  
  // Try exact match first
  if (AIRLINE_LOGOS[normalized]) return AIRLINE_LOGOS[normalized];
  
  // Try IATA code (2-letter uppercase)
  const upper = airlineName.trim().toUpperCase();
  if (IATA_CODES[upper]) return IATA_CODES[upper];
  
  // Try partial match
  for (const [key, url] of Object.entries(AIRLINE_LOGOS)) {
    if (normalized.includes(key) || key.includes(normalized)) return url;
  }
  
  return null;
};
