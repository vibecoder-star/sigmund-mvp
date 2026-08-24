import { EvidenceSource, StudyType } from '@/types';

const PUBMED_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_SUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const EUROPE_PMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

interface PubMedResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi?: string;
  pmid: string;
}

function classifyStudyType(title: string, abstract: string = ''): StudyType {
  const text = (title + ' ' + abstract).toLowerCase();
  if (text.includes('systematic review') || text.includes('systematic literature')) return 'systematic_review';
  if (text.includes('meta-analysis') || text.includes('meta analysis')) return 'meta_analysis';
  if (text.includes('randomized controlled trial') || text.includes('rct') || text.includes('randomised')) return 'rct';
  if (text.includes('cohort') || text.includes('longitudinal') || text.includes('prospective')) return 'observational_study';
  if (text.includes('clinical guideline') || text.includes('consensus statement')) return 'clinical_guideline';
  if (text.includes('freud') || text.includes('jung') || text.includes('psychoanalytic') || text.includes('psychoanalysis')) return 'historical';
  if (text.includes('theoretical') || text.includes('philosophy of mind')) return 'theoretical';
  return 'observational_study';
}

function evidenceLevelFromType(studyType: StudyType): EvidenceSource['evidenceLevel'] {
  switch (studyType) {
    case 'systematic_review':
    case 'meta_analysis':
      return 'strong';
    case 'rct':
      return 'moderate';
    case 'observational_study':
    case 'clinical_guideline':
      return 'moderate';
    case 'expert_consensus':
      return 'limited';
    case 'theoretical':
    case 'historical':
      return 'inconclusive';
    default:
      return 'limited';
  }
}

export async function searchPubMed(query: string, maxResults: number = 5): Promise<EvidenceSource[]> {
  try {
    const searchUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryUrl = `${PUBMED_SUMMARY}?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return [];

    const summaryData = await summaryRes.json();
    const results: EvidenceSource[] = [];

    for (const id of ids) {
      const article = summaryData.result?.[id];
      if (!article) continue;

      const authors = (article.authors || []).map((a: any) => a.name).slice(0, 3);
      const studyType = classifyStudyType(article.title, article.abstract || '');

      results.push({
        id: crypto.randomUUID(),
        title: article.title || 'Untitled',
        authors,
        year: article.pubdate?.split(' ')[0] || 'Unknown',
        journal: article.fulljournalname || article.source || 'Unknown',
        doi: article.elocationid?.replace('doi: ', '') || undefined,
        pmid: id,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        studyType,
        relevance: 'medium',
        evidenceLevel: evidenceLevelFromType(studyType),
      });
    }

    return results;
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

export async function searchEuropePMC(query: string, maxResults: number = 5): Promise<EvidenceSource[]> {
  try {
    const url = `${EUROPE_PMC}?query=${encodeURIComponent(query)}&format=json&pageSize=${maxResults}&sortBy=relevance`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results: EvidenceSource[] = [];

    for (const item of data.resultList?.result || []) {
      const authors = (item.authorList?.author || []).map((a: any) => a.fullName).slice(0, 3);
      const studyType = classifyStudyType(item.title, item.abstractText || '');

      results.push({
        id: crypto.randomUUID(),
        title: item.title || 'Untitled',
        authors,
        year: item.pubYear || 'Unknown',
        journal: item.journalTitle || 'Unknown',
        doi: item.doi || undefined,
        pmid: item.pmid || undefined,
        url: `https://europepmc.org/article/MED/${item.pmid}`,
        studyType,
        relevance: 'medium',
        evidenceLevel: evidenceLevelFromType(studyType),
      });
    }

    return results;
  } catch (error) {
    console.error('Europe PMC search error:', error);
    return [];
  }
}

export async function retrieveEvidence(query: string): Promise<EvidenceSource[]> {
  const [pubmed, europePmc] = await Promise.all([
    searchPubMed(query, 3),
    searchEuropePMC(query, 3),
  ]);

  const combined = [...pubmed, ...europePmc];

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = combined.filter(source => {
    const key = source.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by evidence level
  const levelOrder = { strong: 0, moderate: 1, limited: 2, inconclusive: 3 };
  deduped.sort((a, b) => levelOrder[a.evidenceLevel] - levelOrder[b.evidenceLevel]);

  return deduped.slice(0, 5);
}

export function formatEvidenceForResponse(sources: EvidenceSource[]): string {
  if (sources.length === 0) return '';

  const sections = ['\n--- EVIDENCE ---'];
  sources.forEach((s, i) => {
    sections.push(`${i + 1}. ${s.title} (${s.year}) - ${s.journal}`);
    sections.push(`   Type: ${s.studyType.replace('_', ' ')} | Evidence: ${s.evidenceLevel}`);
    if (s.doi) sections.push(`   DOI: ${s.doi}`);
    if (s.pmid) sections.push(`   PMID: ${s.pmid}`);
  });
  sections.push('--- END EVIDENCE ---\n');

  return sections.join('\n');
}
