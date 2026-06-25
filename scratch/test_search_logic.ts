const { TROUBLESHOOTING_DATABASE } = require('../config/troubleshooting-db');

const normalizeForSearch = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/z/g, 's')
    .replace(/ce/g, 'se')
    .replace(/ci/g, 'si')
    .replace(/[^a-z0-9\s]/g, '');
};

const testSearch = (searchTerm) => {
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
    'de', 'del', 'en', 'para', 'con', 'por', 'que', 'y', 'o', 'a',
    'falla', 'fallas', 'error', 'errores', 'problema', 'problemas', 'fe'
  ]);

  const searchWords = searchTerm
    .trim()
    .split(/\s+/)
    .map(w => normalizeForSearch(w))
    .filter(w => w && !stopWords.has(w));

  console.log('Search terms kept:', searchWords);

  const scoredItems = TROUBLESHOOTING_DATABASE.map(item => {
    const normSymptom = normalizeForSearch(item.symptom);
    const normRootCause = normalizeForSearch(item.root_cause);
    const normProtocol = normalizeForSearch(item.resolution_protocol);
    const normId = normalizeForSearch(item.id);

    let score = 0;
    searchWords.forEach(word => {
      let matches = 0;
      if (normSymptom.includes(word)) matches += 10;
      if (normId.includes(word)) matches += 8;
      if (normRootCause.includes(word)) matches += 3;
      if (normProtocol.includes(word)) matches += 1;

      score += matches;
    });

    return { item, score };
  });

  const results = scoredItems
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);

  console.log(`Results found (${results.length}):`);
  results.forEach(r => console.log(`- ${r.symptom} (ID: ${r.id})`));
};

testSearch("que hacer en caso de que falle la im");
