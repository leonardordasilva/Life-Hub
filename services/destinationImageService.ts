const cache: Record<string, string> = {};

const extractCityName = (destination: string): string => {
  const parts = destination.split(',').map(p => p.trim());
  return parts[0];
};

const tryWikipedia = async (query: string): Promise<string | null> => {
  const formatted = query.replace(/\s+/g, '_');
  const urls = [
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formatted)}`,
    `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formatted)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.originalimage?.source) return data.originalimage.source;
      if (data.thumbnail?.source) {
        return data.thumbnail.source.replace(/\/\d+px-/, '/1200px-');
      }
    } catch {}
  }
  return null;
};

const tryWikipediaSearch = async (query: string): Promise<string | null> => {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' city travel')}&format=json&origin=*&srlimit=3`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    for (const result of searchData.query?.search || []) {
      const title = result.title;
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!summaryRes.ok) continue;
      const summaryData = await summaryRes.json();
      if (summaryData.originalimage?.source) return summaryData.originalimage.source;
      if (summaryData.thumbnail?.source) {
        return summaryData.thumbnail.source.replace(/\/\d+px-/, '/1200px-');
      }
    }
  } catch {}
  return null;
};

export const fetchDestinationImage = async (destination: string): Promise<string | null> => {
  if (!destination) return null;

  if (cache[destination]) return cache[destination];

  const city = extractCityName(destination);

  let imageUrl = await tryWikipedia(city);

  if (!imageUrl) {
    imageUrl = await tryWikipedia(destination.replace(/,/g, ''));
  }

  if (!imageUrl) {
    imageUrl = await tryWikipediaSearch(city);
  }

  if (imageUrl) {
    cache[destination] = imageUrl;
  }

  return imageUrl;
};
