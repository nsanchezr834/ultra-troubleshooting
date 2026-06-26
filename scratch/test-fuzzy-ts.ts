import { TROUBLESHOOTING_DATABASE } from '../config/troubleshooting-db';

function localFuzzySearch(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .split(/\s+/)
    .filter(t => t.length > 3); // ignora artículos cortos

  if (tokens.length === 0) return [];

  console.log('Query Tokens:', tokens);

  const scored = TROUBLESHOOTING_DATABASE.map(entry => {
    const keywordsField = (entry as any).keywords || '';
    const haystack = (entry.symptom + ' ' + keywordsField).toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const hits = tokens.filter(t => haystack.includes(t)).length;
    return { title: entry.symptom, score: hits };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(r => r.title);
}

const query = "la bagger no me dio bolsas";
const results = localFuzzySearch(query);
console.log('Results:', results);
