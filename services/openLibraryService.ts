import { supabase } from './supabaseClient';

const COVER_BASE_URL = 'https://covers.openlibrary.org/b';

const fetchOpenLibrary = async (rawUrl: string) => {
  try {
    const urlObj = new URL(rawUrl, 'http://localhost');
    const path = urlObj.pathname.replace(/^\/api\/openlibrary\/?/, '');
    const query = urlObj.searchParams.toString();

    const { data, error } = await supabase.functions.invoke('openlibrary-proxy', {
      body: { action: 'openlibrary_proxy', path, query }
    });
    if (error) throw error;
    return data;
  } catch (e) {
    throw e;
  }
};

export interface OpenLibraryResult {
  title: string;
  author?: string;
  posterUrl: string | null;
  releaseDate?: string;
  key?: string; // Open Library ID/Key
  synopsis?: string;
  rating?: number;
}

// Auxiliar para extrair uma data válida YYYY-MM-DD de strings variadas da Open Library
const parseOLDate = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;

  // Tenta encontrar um ano (4 dígitos)
  const yearMatch = dateStr.match(/\d{4}/);
  if (!yearMatch) return undefined;
  const year = yearMatch[0];

  // Mapeamento de meses para tentar converter datas completas
  const months: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };

  let month = '01';
  let day = '01';

  // Tenta encontrar o mês por nome
  const lowerDate = dateStr.toLowerCase();
  for (const [name, num] of Object.entries(months)) {
    if (lowerDate.includes(name)) {
      month = num;
      break;
    }
  }

  // Tenta encontrar um dia (1 ou 2 dígitos isolados)
  const dayMatch = dateStr.match(/(?:^|\s)(\d{1,2})(?:st|nd|rd|th)?(?:,|\s|$)/);
  if (dayMatch) {
    day = dayMatch[1].padStart(2, '0');
  }

  return `${year}-${month}-${day}`;
};

export const searchByISBN = async (isbn: string): Promise<OpenLibraryResult | null> => {
  if (!isbn) return null;

  const cleanISBN = isbn.replace(/[-\s]/g, '');

  try {
    // 1. Busca primeiro o endpoint direto de ISBN para pegar metadados exatos da edição (Título em PT)
    const editionData = await fetchOpenLibrary(`/api/openlibrary/isbn/${cleanISBN}.json`);
    if (!editionData) return null;
    const title = editionData.title || '';
    let authorName = '';
    let synopsis = '';
    let releaseDate = parseOLDate(editionData.publish_date);

    // 2. Buscar Autores (Pode estar na Edição ou na Work)
    let authorsList = editionData.authors || [];

    // Se não tem autores na edição, tenta pegar da Work
    if (authorsList.length === 0 && editionData.works && editionData.works.length > 0) {
      try {
        const workData = await fetchOpenLibrary(`/api/openlibrary${editionData.works[0].key}.json`);
        if (workData) {
          authorsList = workData.authors || [];

          // Aproveita para pegar a sinopse da Work se não tiver na Edição
          if (typeof workData.description === 'string') synopsis = workData.description;
          else if (workData.description?.value) synopsis = workData.description.value;
        }
      } catch { }
    }

    // Traduz chaves de autor para nomes reais
    if (authorsList.length > 0) {
      try {
        const authorKey = authorsList[0].key || authorsList[0].author?.key;
        if (authorKey) {
          const authData = await fetchOpenLibrary(`/api/openlibrary${authorKey}.json`);
          if (authData) {
            authorName = authData.name;
          }
        }
      } catch { }
    }

    // 3. Fallback de Sinopse caso ainda esteja vazia
    if (!synopsis && editionData.description) {
      synopsis = typeof editionData.description === 'string'
        ? editionData.description
        : editionData.description.value;
    }

    return {
      title,
      author: authorName || 'Autor Desconhecido',
      posterUrl: editionData.covers ? `${COVER_BASE_URL}/id/${editionData.covers[0]}-L.jpg` : null,
      releaseDate: releaseDate,
      synopsis: synopsis || undefined,
      key: editionData.key || `/isbn/${cleanISBN}`
    };
  } catch (error) {
    console.error("Erro ao buscar ISBN na Open Library:", error);
    return null;
  }
};

export const getBookDetails = async (key: string): Promise<OpenLibraryResult | null> => {
  if (!key) return null;

  try {
    const url = `/api/openlibrary${key}.json`;
    const data = await fetchOpenLibrary(url);
    if (!data) return null;

    let synopsis = "";
    if (typeof data.description === 'string') synopsis = data.description;
    else if (data.description?.value) synopsis = data.description.value;

    let author = '';

    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].author?.key || data.authors[0].key;
      if (authorKey) {
        try {
          const authorData = await fetchOpenLibrary(`/api/openlibrary${authorKey}.json`);
          if (authorData) {
            author = authorData.name || '';
          }
        } catch { }
      }
    }

    if (!synopsis && data.works?.[0]?.key) {
      try {
        const workData = await fetchOpenLibrary(`/api/openlibrary${data.works[0].key}.json`);
        if (typeof workData.description === 'string') synopsis = workData.description;
        else if (workData.description?.value) synopsis = workData.description.value;
      } catch { }
    }

    return {
      title: data.title,
      author: author || undefined,
      posterUrl: data.covers ? `${COVER_BASE_URL}/id/${data.covers[0]}-L.jpg` : null,
      releaseDate: parseOLDate(data.publish_date || data.first_publish_date),
      synopsis: synopsis || undefined
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do livro:", error);
    return null;
  }
};

export const searchOpenLibrary = async (query: string, isbn?: string): Promise<OpenLibraryResult | null> => {
  if (!query && !isbn) return null;
  if (isbn) return await searchByISBN(isbn);

  try {
    // Adicionado ratings_average aos fields
    const searchUrl = `/api/openlibrary/search.json?q=${encodeURIComponent(query)}&limit=1&fields=title,author_name,first_publish_year,cover_i,key,ratings_average`;
    const data = await fetchOpenLibrary(searchUrl);

    if (data.docs && data.docs.length > 0) {
      const doc = data.docs[0];
      const details = await getBookDetails(doc.key);
      if (details) {
        // Injeta o rating que veio da busca, pois o endpoint de detalhes (edition/work) nem sempre tem fácil acesso
        details.rating = doc.ratings_average;
        return details;
      }
      return {
        title: doc.title,
        author: doc.author_name?.[0],
        posterUrl: doc.cover_i ? `${COVER_BASE_URL}/id/${doc.cover_i}-L.jpg` : null,
        key: doc.key,
        rating: doc.ratings_average
      };
    }
  } catch (e) { }
  return null;
};

export const searchOpenLibraryMany = async (query: string, isIsbnSearch: boolean = false): Promise<OpenLibraryResult[]> => {
  if (!query) return [];

  try {
    const finalQuery = isIsbnSearch ? `isbn:${query.replace(/[-\s]/g, '')}` : query;
    // Adicionado ratings_average aos fields
    const searchUrl = `/api/openlibrary/search.json?q=${encodeURIComponent(finalQuery)}&limit=10&fields=title,author_name,publish_date,cover_i,key,ratings_average`;
    const data = await fetchOpenLibrary(searchUrl);

    if (data.docs && data.docs.length > 0) {
      return data.docs.map((doc: any) => ({
        title: doc.title,
        author: doc.author_name?.[0] || 'Autor Desconhecido',
        posterUrl: doc.cover_i ? `${COVER_BASE_URL}/id/${doc.cover_i}-L.jpg` : null,
        releaseDate: parseOLDate(doc.publish_date ? (Array.isArray(doc.publish_date) ? doc.publish_date[0] : doc.publish_date) : undefined),
        key: doc.key,
        rating: doc.ratings_average
      }));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar múltiplos na Open Library:", error);
    return [];
  }
};
