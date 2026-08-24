import { SafetyClassification } from '@/types';

const SELF_HARM_KEYWORDS = [
  'suicid', 'kill myself', 'end my life', 'want to die', 'non voglio più vivere',
  'ammazzarmi', 'togliermi la vita', 'morte', 'impiccare', 'tagliare i polsi',
  'overdose', 'pillole per dormire', 'buttarmi', 'saltare', 'cut myself',
  'mi taglio', 'mi ferisco', 'hurt myself', 'self harm', 'soffrire in silenzio'
];

const SUICIDAL_IDEATION_KEYWORDS = [
  'penso di morire', 'non ha senso vivere', 'niente ha più senso',
  'sarebbe meglio se non fossi qui', 'voglio sparire', 'non ce la faccio più',
  'thoughts of ending it', 'no reason to live', 'burden to others',
  'nobody would miss me', 'wish i wouldnt wake up', 'thinking about how to do it',
  'just fade away', 'dont want to be here', 'sarebbe meglio senza di me',
  'non esserci', 'farla finita'
];

const VIOLENCE_KEYWORDS = [
  'voglio ferire', 'voglio uccidere', 'odio qualcuno', 'picchiare',
  'hurt someone', 'kill someone', 'violence', 'omicidio',
  'ferire qualcuno', 'colpire', 'violenza'
];

const PSYCHOSIS_KEYWORDS = [
  'sentono voci', 'mi parlano', 'nessuno mi crede', 'sono controllato',
  'paranoia', 'mi seguono', 'camere a gas', 'chip sotto la pelle',
  'hearing voices', 'hear voices', 'being watched', 'mind control', 'government is monitoring',
  'cia is tracking', 'mi spiano', 'teoria del complotto', 'delirio',
  'voci nella testa', 'non esiste'
];

const MEDICAL_EMERGENCY_KEYWORDS = [
  'dolore al petto', 'non respiro', 'infarto', 'ictus', 'emorragia',
  'chest pain', 'cant breathe', 'stroke', 'seizure', 'unconscious'
];

const MEDICATION_KEYWORDS = [
  'farmaco', 'dosaggio', 'antidepressivo', 'ansiolitico', 'dosaggio',
  'medication', 'prescription', 'mg', 'antipsicotico', ' stabilizzatore',
  'antidepressants', 'xanax', 'seralina', 'lexapro', 'prozac', 'zoloft',
  'medicinale', 'pillole', 'assumere', 'dose', 'drug', 'pharmacolog'
];

const DIAGNOSIS_KEYWORDS = [
  'ho la depressione', 'sono bipolare', 'ho il borderline', 'ho disturbo',
  'do i have depression', 'am i bipolar', 'diagnose me', 'penso di avere',
  'clinically', 'mental illness', 'personality disorder', 'adhd', 'autismo',
  'sindrome di', 'disturbo di', 'ho il disturbo', 'ho la sindrome',
  'bipolar', 'borderline', 'narcisist', 'sociopat', 'psicopat',
  'schizophrenia', 'schizofrenia', 'ocd', 'ptsd', 'cptsd'
];

const DISTRESS_KEYWORDS = [
  'piango', 'triste', 'ansia', 'panico', 'paura', 'solo', 'inadeguato',
  'cry', 'sad', 'anxious', 'panic', 'scared', 'lonely', 'worthless',
  'overwhelmed', 'breaking down', 'falling part'
];

export function classifyMessage(message: string): SafetyClassification {
  const lower = message.toLowerCase();

  if (SELF_HARM_KEYWORDS.some(k => lower.includes(k))) return 'SELF_HARM';
  if (SUICIDAL_IDEATION_KEYWORDS.some(k => lower.includes(k))) return 'SUICIDAL_IDEATION';
  if (MEDICAL_EMERGENCY_KEYWORDS.some(k => lower.includes(k))) return 'MEDICAL_EMERGENCY';
  if (VIOLENCE_KEYWORDS.some(k => lower.includes(k))) return 'VIOLENCE';
  if (PSYCHOSIS_KEYWORDS.some(k => lower.includes(k))) return 'PSYCHOSIS';
  if (MEDICATION_KEYWORDS.some(k => lower.includes(k))) return 'MEDICATION_QUESTION';
  if (DIAGNOSIS_KEYWORDS.some(k => lower.includes(k))) return 'DIAGNOSIS_REQUEST';
  if (DISTRESS_KEYWORDS.some(k => lower.includes(k))) return 'DISTRESS';

  return 'NORMAL';
}

export function getSafetyResponse(safety: SafetyClassification): string | null {
  switch (safety) {
    case 'SELF_HARM':
    case 'SUICIDAL_IDEATION':
      return 'Mi prendi molto a cuore leggere questo. Non sei solo/a in questo momento. Ti chiedo di considerare seriamente di parlare con qualcuno che può aiutare: il numero di emergenza 112, o il Telefono Amico (02 2327 2327) sono disponibili ora. Non devi affrontare questo da solo/a.';
    case 'MEDICAL_EMERGENCY':
      return 'Quello che descrivi richiede un\'attenzione medica immediata. Ti chiamo di chiamare il 112 o di recarti al pronto soccorso più vicino. Non è qualcosa che posso gestire qui.';
    case 'VIOLENCE':
      return 'Sento che c\'è molta rabbia in quello che dici. La rabbia è comprensibile, ma se senti di poter fare del male a qualcuno, ti chiedo di fermarti e di parlare con un professionista. Il 112 è disponibile se serve un supporto immediato.';
    case 'PSYCHOSIS':
      return 'Quello che descrivi sembra molto destabilizzante. Ti suggerisco di contattare un professionista della salute mentale il prima possibile. Se ti senti in pericolo, chiama il 112.';
    case 'MEDICATION_QUESTION':
      return 'Non posso consigliare dosaggi o farmaci specifici. Questo è un ambito che richiede un medico o uno psichiatra. Ti suggerisco di parlarne con il tuo medico curante.';
    case 'DIAGNOSIS_REQUEST':
      return 'Non posso fornire una diagnosi clinica — nessuno può farlo in una conversazione. Posso aiutarti a riflettere su ciò che stai vivendo, ma una valutazione diagnostica richiede uno specialista.';
    case 'DISTRESS':
      return null;
    default:
      return null;
  }
}
