/**
 * Utility functions to fix UTF-8 encoding issues from backend
 */

export const fixEncodingIssues = (text: string | null | undefined): string => {
  if (!text) return text || '';
  
  // Mapeo de caracteres mal codificados a correctos
  const fixes: Record<string, string> = {
    'CaÃ±ada': 'Cañada',
    'Ã±': 'ñ',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã ': 'à',
    'Ã¨': 'è',
    'Ã¬': 'ì',
    'Ã²': 'ò',
    'Ã¹': 'ù',
    'Ã¤': 'ä',
    'Ã«': 'ë',
    'Ã¯': 'ï',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'Ã': 'Ñ',
    'baÃ±os': 'baños',
    'vegetaciÃ³n': 'vegetación',
    'ObservaciÃ³n': 'Observación',
    'biolÃ³gicos': 'biológicos',
    'mÃ¡s': 'más',
    'paisajÃ­stico': 'paisajístico',
    'panorÃ¡micos': 'panorámicos'
  };
  
  let result = text;
  for (const [bad, good] of Object.entries(fixes)) {
    result = result.replace(new RegExp(bad, 'g'), good);
  }
  
  return result;
};

export const fixObjectEncoding = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const fixed = { ...obj };
  
  for (const [key, value] of Object.entries(fixed)) {
    if (typeof value === 'string') {
      fixed[key] = fixEncodingIssues(value);
    } else if (Array.isArray(value)) {
      fixed[key] = value.map(item => 
        typeof item === 'object' ? fixObjectEncoding(item) : 
        typeof item === 'string' ? fixEncodingIssues(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      fixed[key] = fixObjectEncoding(value);
    }
  }
  
  return fixed;
};

export const fixArrayEncoding = <T extends any[]>(arr: T): T => {
  if (!Array.isArray(arr)) return arr;
  
  return arr.map(item => 
    typeof item === 'object' ? fixObjectEncoding(item) :
    typeof item === 'string' ? fixEncodingIssues(item) : item
  ) as T;
};
