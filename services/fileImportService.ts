import * as XLSX from 'xlsx';

export interface ImportedRow {
  title: string;
  status?: string;
  rating?: number;
  platform?: string;
  genres?: string[];
  author?: string;
  isbn?: string;
  synopsis?: string;
  [key: string]: any;
}

export interface ImportResult {
  rows: ImportedRow[];
  headers: string[];
  errors: string[];
}

const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.txt'];

const STATUS_MAP: Record<string, string> = {
  'pendente': 'PENDING',
  'pending': 'PENDING',
  'backlog': 'PENDING',
  'assistindo': 'WATCHING',
  'watching': 'WATCHING',
  'jogando': 'WATCHING',
  'playing': 'WATCHING',
  'lendo': 'WATCHING',
  'reading': 'WATCHING',
  'completo': 'COMPLETED',
  'completed': 'COMPLETED',
  'concluído': 'COMPLETED',
  'concluido': 'COMPLETED',
  'zerado': 'COMPLETED',
  'finished': 'COMPLETED',
  'casual': 'CASUAL',
};

const HEADER_MAP: Record<string, string> = {
  'título': 'title',
  'titulo': 'title',
  'nome': 'title',
  'name': 'title',
  'title': 'title',
  'status': 'status',
  'estado': 'status',
  'nota': 'rating',
  'rating': 'rating',
  'avaliação': 'rating',
  'avaliacao': 'rating',
  'plataforma': 'platform',
  'platform': 'platform',
  'gênero': 'genres',
  'genero': 'genres',
  'gêneros': 'genres',
  'generos': 'genres',
  'genres': 'genres',
  'genre': 'genres',
  'autor': 'author',
  'author': 'author',
  'isbn': 'isbn',
  'sinopse': 'synopsis',
  'synopsis': 'synopsis',
  'descrição': 'synopsis',
  'descricao': 'synopsis',
  'description': 'synopsis',
};

export function validateFileExtension(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return HEADER_MAP[clean] || HEADER_MAP[header.trim().toLowerCase()] || header.trim().toLowerCase();
}

function normalizeStatus(value: string): string {
  const clean = value.trim().toLowerCase();
  return STATUS_MAP[clean] || 'PENDING';
}

function parseGenres(value: string): string[] {
  if (!value) return [];
  return value.split(/[,;|]/).map(g => g.trim()).filter(Boolean);
}

function parseRating(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(String(value).replace(',', '.'));
  if (isNaN(num)) return undefined;
  return Math.round(Math.min(10, Math.max(0, num)) * 10) / 10;
}

function rawRowsToImported(rawRows: Record<string, any>[]): ImportResult {
  const errors: string[] = [];
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const normalizedHeaders = headers.map(normalizeHeader);

  const rows: ImportedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const mapped: Record<string, any> = {};

    headers.forEach((h, idx) => {
      const key = normalizedHeaders[idx];
      mapped[key] = raw[h];
    });

    const title = mapped.title ? String(mapped.title).trim() : '';
    if (!title) {
      errors.push(`Linha ${i + 2}: título vazio, ignorada.`);
      continue;
    }

    const row: ImportedRow = {
      title,
      status: mapped.status ? normalizeStatus(String(mapped.status)) : 'PENDING',
      rating: parseRating(mapped.rating),
      platform: mapped.platform ? String(mapped.platform).trim() : undefined,
      genres: mapped.genres ? parseGenres(String(mapped.genres)) : undefined,
      author: mapped.author ? String(mapped.author).trim() : undefined,
      isbn: mapped.isbn ? String(mapped.isbn).trim() : undefined,
      synopsis: mapped.synopsis ? String(mapped.synopsis).trim() : undefined,
    };

    rows.push(row);
  }

  return { rows, headers: normalizedHeaders, errors };
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const ext = getFileExtension(file.name);

  if (!validateFileExtension(file.name)) {
    return { rows: [], headers: [], errors: [`Formato não suportado: ${ext}. Use .xlsx, .xls, .csv ou .txt`] };
  }

  try {
    if (ext === '.txt') {
      return await parseTxtFile(file);
    }

    // xlsx, xls, csv all handled by xlsx library
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    if (rawRows.length === 0) {
      return { rows: [], headers: [], errors: ['O arquivo está vazio ou sem dados válidos.'] };
    }

    return rawRowsToImported(rawRows);
  } catch (e: any) {
    return { rows: [], headers: [], errors: [`Erro ao processar arquivo: ${e.message || 'Erro desconhecido'}`] };
  }
}

async function parseTxtFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  if (lines.length === 0) {
    return { rows: [], headers: [], errors: ['Arquivo vazio.'] };
  }

  // Detect separator: tab, semicolon, or comma
  const firstLine = lines[0];
  let separator = '\t';
  if (firstLine.includes('\t')) separator = '\t';
  else if (firstLine.includes(';')) separator = ';';
  else if (firstLine.includes(',')) separator = ',';

  const headers = firstLine.split(separator).map(h => h.trim());

  // Check if first line looks like headers
  const normalizedFirst = headers.map(h => normalizeHeader(h));
  const hasHeaderRow = normalizedFirst.some(h => ['title', 'status', 'rating', 'platform'].includes(h));

  if (!hasHeaderRow) {
    // Treat as simple title list
    const rows: ImportedRow[] = lines.map(l => ({ title: l.trim(), status: 'PENDING' })).filter(r => r.title);
    return { rows, headers: ['title'], errors: [] };
  }

  const rawRows = lines.slice(1).map(line => {
    const values = line.split(separator);
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ''; });
    return obj;
  });

  return rawRowsToImported(rawRows);
}
