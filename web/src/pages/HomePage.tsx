import { useState, useEffect } from 'react';
import { appointmentsService, holidaysService, type TimeSlot, type CreateAppointmentDto, type Holiday } from '../services/api';
import {
  Car,
  Truck,
  Clock,
  Calendar,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCheck,
  Users,
  Award,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Wrench,
  Eye,
  Gauge,
  CircleDot,
  FileText,
  BadgeCheck,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type VehicleCategory = 'AUTOTURISM' | 'AUTOUTILITARA';

const VEHICLE_CATEGORIES = [
  {
    id: 'AUTOTURISM' as VehicleCategory,
    label: 'Autoturism',
    description: 'Categoria M1 - Vehicule pentru transport persoane',
    icon: Car,
    duration: 30,
  },
  {
    id: 'AUTOUTILITARA' as VehicleCategory,
    label: 'Autoutilitară',
    description: 'Categoria N1 - Vehicule pentru transport marfă ≤3.5t',
    icon: Truck,
    duration: 30,
  },
];

const DAYS_RO = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

// ===========================================
// SĂRBĂTORI ORTODOXE ROMÂNE CU CRUCE ROȘIE
// Zile în care NU se lucrează - conform Calendar Ortodox
// Format: 'MM-DD' pentru sărbători fixe, calculate dinamic pentru Paște
// ===========================================

// Funcție pentru calculul datei Paștelui Ortodox (algoritm Meeus/Jones/Butcher)
function getOrthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;

  // Data Paștelui în calendarul Iulian
  const julianEaster = new Date(year, month - 1, day);

  // Convertire la calendarul Gregorian (adăugăm 13 zile pentru sec. 20-21)
  julianEaster.setDate(julianEaster.getDate() + 13);

  return julianEaster;
}

// Generează lista sărbătorilor pentru un an dat
function getHolidaysForYear(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  // === SĂRBĂTORI FIXE (cu cruce roșie) ===

  // Ianuarie
  holidays.set(`${year}-01-01`, 'Anul Nou - Sfântul Vasile cel Mare');
  holidays.set(`${year}-01-02`, 'A doua zi de Anul Nou');
  holidays.set(`${year}-01-06`, 'Boboteaza - Botezul Domnului');
  holidays.set(`${year}-01-07`, 'Soborul Sf. Ioan Botezătorul');
  holidays.set(`${year}-01-24`, 'Ziua Unirii Principatelor');

  // Martie
  holidays.set(`${year}-03-25`, 'Buna Vestire');

  // Mai
  holidays.set(`${year}-05-01`, 'Ziua Muncii');

  // Iunie
  holidays.set(`${year}-06-01`, 'Ziua Copilului');

  // August
  holidays.set(`${year}-08-15`, 'Adormirea Maicii Domnului');

  // Noiembrie
  holidays.set(`${year}-11-30`, 'Sfântul Apostol Andrei');

  // Decembrie
  holidays.set(`${year}-12-01`, 'Ziua Națională a României');
  holidays.set(`${year}-12-25`, 'Nașterea Domnului (Crăciunul)');
  holidays.set(`${year}-12-26`, 'A doua zi de Crăciun');

  // === SĂRBĂTORI MOBILE (calculate după Paște) ===

  const easter = getOrthodoxEaster(year);

  // Helper local pentru formatare (înainte de a fi definită global)
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Vinerea Mare (2 zile înainte de Paște)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.set(formatDate(goodFriday), 'Vinerea Mare');

  // Sâmbăta Mare
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);
  holidays.set(formatDate(holySaturday), 'Sâmbăta Mare');

  // Prima zi de Paște
  holidays.set(formatDate(easter), 'Învierea Domnului (Paștele)');

  // A doua zi de Paște
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.set(formatDate(easterMonday), 'A doua zi de Paște');

  // A treia zi de Paște (opțional, unele firme lucrează)
  const easterTuesday = new Date(easter);
  easterTuesday.setDate(easter.getDate() + 2);
  holidays.set(formatDate(easterTuesday), 'A treia zi de Paște');

  // Înălțarea Domnului (40 zile după Paște)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  holidays.set(formatDate(ascension), 'Înălțarea Domnului');

  // Rusaliile - Prima zi (50 zile după Paște)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  holidays.set(formatDate(pentecost), 'Rusaliile (Pogorârea Sf. Duh)');

  // Rusaliile - A doua zi (51 zile după Paște)
  const pentecostMonday = new Date(easter);
  pentecostMonday.setDate(easter.getDate() + 50);
  holidays.set(formatDate(pentecostMonday), 'A doua zi de Rusalii');

  return holidays;
}

// Formatează data ca YYYY-MM-DD în timezone local (nu UTC!)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Verifică dacă o dată este sărbătoare
function isHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);
  const dateStr = formatDateLocal(date);

  if (holidays.has(dateStr)) {
    return { isHoliday: true, name: holidays.get(dateStr) };
  }
  return { isHoliday: false };
}

// Verifică dacă o oră a trecut deja în ziua curentă
function isTimeSlotPassed(date: Date, timeSlot: string): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Dacă data selectată e în viitor, slotul e disponibil
  if (selectedDate > today) {
    return false;
  }

  // Dacă data selectată e în trecut, slotul nu e disponibil
  if (selectedDate < today) {
    return true;
  }

  // Dacă e azi, verificăm ora
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  // Adăugăm 30 minute buffer - nu poți programa pentru ora curentă sau următoarea
  const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);

  return slotTime <= bufferTime;
}

// ===========================================
// INFORMAȚII CONFORM RNTR 1 - RAR ROMÂNIA
// Reglementări privind Inspecția Tehnică Periodică
// Actualizat conform Ordinului 77/2020
// ===========================================

// ITP Preparation Checklist - CONFORM RNTR 1 + Regulamente CEE-ONU
const ITP_CHECKLIST = [
  {
    category: '1. IDENTIFICARE VEHICUL',
    icon: FileCheck,
    color: 'blue',
    intro: 'Prima verificare la ITP - se compară datele vehiculului cu documentele',
    items: [
      '✓ Numărul de înmatriculare trebuie să fie lizibil, curat și conform standardelor',
      '✓ Seria de șasiu (VIN) trebuie să fie vizibilă și să corespundă cu CIV-ul',
      '✓ Plăcuța producătorului trebuie să existe și să fie lizibilă',
      '✓ Cartea de Identitate a Vehiculului (CIV) - original, valid',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Plăcuțe de înmatriculare ușor deteriorate dar lizibile',
      '⚠ Plăcuța producătorului parțial ilizibilă (dar VIN-ul vizibil)',
      '⚠ Etichete lipsă pe geamuri (nu afectează siguranța)',
      '✗ RESPINGERE: Date neconcordante între vehicul și documente',
    ],
  },
  {
    category: '2. SISTEM DE FRÂNARE',
    icon: CircleDot,
    color: 'red',
    intro: 'Se testează pe stand cu role - măsurăm forța de frânare la fiecare roată',
    items: [
      '✓ Eficiență frână de serviciu: MINIM 50% din greutatea vehiculului',
      '✓ Eficiență frână de staționare (mână): MINIM 20% din greutate',
      '✓ Dezechilibru între roți pe aceeași axă: MAXIM 20% la frâna de serviciu',
      '✓ Dezechilibru la frâna de mână: MAXIM 30%',
      '✓ CE ÎNSEAMNĂ: Dacă apăsați frâna, mașina trebuie să oprească drept, fără să tragă',
      '✓ Fără scurgeri de lichid de frână pe discuri, tamburi sau furtunuri',
      '✓ Plăcuțe cu material de frecare suficient (min. 2mm)',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Pedala de frână cu îmbrăcăminte (cauciuc) uzată - de schimbat!',
      '⚠ Lipsa capacului de la rezervorul lichidului de frână',
      '⚠ Manșoane de protecție ușor deteriorate (dar etanșe)',
      '⚠ Discuri cu rugină superficială (normală după staționare)',
      '✗ PERICULOS: Frâne sub 50% eficiență = FĂRĂ DREPT DE CIRCULAȚIE!',
    ],
  },
  {
    category: '3. DIRECȚIE ȘI SUSPENSIE',
    icon: Wrench,
    color: 'purple',
    intro: 'Se verifică pe elevator - inspectorul mișcă roțile pentru a detecta jocuri',
    items: [
      '✓ Volanul să nu aibă joc excesiv (max 10-15° mișcare fără efect la roți)',
      '✓ Capete de bară (articulațiile care leagă volanul de roți) - FĂRĂ JOC',
      '✓ Pivotul fuzetei (unde se rotește roata) - fără joc, fără uzură',
      '✓ Bielete direcție - conectate solid, fără joc',
      '✓ Amortizoare - fără scurgeri de ulei, funcționale',
      '✓ Arcuri - fără fisuri, rupturi sau lipsă spirale',
      '✓ Bielete antiruliu (stabilizatoare) - conectate și funcționale',
      '✓ CE ÎNSEAMNĂ: Când mișcați volanul, roțile să răspundă imediat, fără întârziere',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Burduf pivot/cap bară cu mică fisură (dar fără joc la articulație)',
      '⚠ Amortizor cu urmă de umezeală (nu scurgere activă)',
      '⚠ Praf cauciuc la tampoane suspensie (uzură normală)',
      '⚠ Zgomote minore la suspensie la denivelări mici',
      '✗ PERICULOS: Joc la direcție = FĂRĂ DREPT DE CIRCULAȚIE!',
    ],
  },
  {
    category: '4. SISTEM DE ILUMINARE',
    icon: Lightbulb,
    color: 'yellow',
    intro: 'Se verifică funcționarea și reglajul conform Regulamentului CEE-ONU R48',
    items: [
      '✓ Faruri fază scurtă (lumini de întâlnire) - funcționale, reglate corect',
      '✓ Faruri fază lungă (lumini de drum) - funcționale, comutare corectă',
      '✓ Lumini de poziție față (albe/galbene) și spate (roșii)',
      '✓ Semnalizatoare - față, spate, laterale - frecvență 60-120 bătăi/min',
      '✓ Stopuri de frână - toate funcționale (inclusiv al 3-lea stop)',
      '✓ Lumini marșarier (albe) - să se aprindă în marșarier',
      '✓ Lumini plăcuță înmatriculare - să se vadă numărul noaptea',
      '✓ Proiectoare ceață (dacă sunt montate) - culoare corectă',
      '✓ Avarii (toate semnalizatoarele simultan) - funcționale',
      '✓ REGLAJ FARURI: Să nu orbiți șoferii din sens opus',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Faruri îngălbenite/mătuite dar cu fascicul luminos corespunzător',
      '⚠ O lampă din DOUĂ de iluminat plăcuță număr nefuncțională',
      '⚠ Sticlă far cu zgârieturi superficiale (fără fisuri)',
      '⚠ Dispozitiv de reglare faruri uzat dar funcțional',
      '⚠ Bec poziție cu intensitate ușor redusă',
      '✗ MAJOR: Far principal nefuncțional = RESPINGERE!',
    ],
  },
  {
    category: '5. ANVELOPE ȘI ROȚI',
    icon: CircleDot,
    color: 'gray',
    intro: 'Conform Regulamentului CEE-ONU R30/R54 și specificațiile din CIV',
    items: [
      '✓ Adâncime profil: MINIM 1.6mm pe toată lățimea și circumferința',
      '✓ ATENȚIE: Majoritatea producătorilor recomandă schimbarea la 3-4mm!',
      '✓ Dimensiuni IDENTICE cu cele din CIV (ex: 205/55 R16)',
      '✓ Pe aceeași axă: OBLIGATORIU aceleași dimensiuni și tip',
      '✓ Fără tăieturi, crăpături, umflături (hernii) sau deformări',
      '✓ Indicatorul de uzură (TWI) să nu fie atins',
      '✓ Jante fără fisuri, lovituri sau deformări',
      '✓ Toate prezoanele prezente și strânse corect',
      '✓ IARNA (1 nov - 31 mar): Obligatoriu M+S sau simbolul 3PMSF (fulg)',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Suportul roții de rezervă în stare necorespunzătoare',
      '⚠ Roată de rezervă cu profil uzat (dar prezentă)',
      '⚠ Capace roți lipsă sau deteriorate',
      '⚠ Un prezon lipsă (din 5) - DAR trebuie remediat urgent!',
      '⚠ Jantă cu zgârieturi cosmetice (fără fisuri structurale)',
      '✗ MAJOR: Anvelope neconforme cu CIV = RESPINGERE!',
    ],
  },
  {
    category: '6. CAROSERIE ȘI ȘASIU',
    icon: Eye,
    color: 'cyan',
    intro: 'Se verifică integritatea structurală conform cerințelor de siguranță CEE-ONU',
    items: [
      '✓ UNDE ESTE PERMISĂ RUGINA: Aripi, capote, uși (suprafețe nestructurale)',
      '✗ UNDE NU E PERMISĂ: Lonjeroane, praguri, puncte de prindere suspensie',
      '✓ Parbriz: Fără fisuri în zona de vizibilitate (baleiaj ștergătoare)',
      '✓ Oglinzi retrovizoare: Toate prezente și funcționale',
      '✓ Ștergătoare parbriz: Funcționale, lamele în stare bună',
      '✓ Spălătoare parbriz: Funcționale, cu lichid',
      '✓ Uși: Se deschid, închid și încuie corect',
      '✓ Capotă și portbagaj: Se închid și se asigură corect',
      '✓ Centuri de siguranță: Toate funcționale, se blochează la tracțiune',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Geam lateral fisurat (nu parbriz!) - de înlocuit conform CCR',
      '⚠ Oglinzi cu zgârieturi ușoare dar funcționale',
      '⚠ Sistem de dezaburire parțial nefuncțional',
      '⚠ Rugină superficială pe aripi/portiere (nesträpunsă)',
      '⚠ Bandă cauciuc (etanșare) ușor deteriorată',
      '⚠ Mâner ușă interior dificil de acționat',
      '⚠ Dispozitiv antifurt (blocaj volan) defect',
      '✗ PERICULOS: Coroziune străpunsă pe șasiu = FĂRĂ CIRCULAȚIE!',
    ],
  },
  {
    category: '7. EMISII POLUANTE',
    icon: Gauge,
    color: 'green',
    intro: 'Se măsoară conform Regulamentului CEE-ONU R83 (benzină) și R24 (diesel). Pentru vehicule 2021+: Regulamentul UE 2021/392 privind OBFCM.',
    legalLink: 'https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32021R0392',
    items: [
      '═══ MOTOARE PE BENZINĂ ═══',
      '✓ Se măsoară: CO (monoxid de carbon) și HC (hidrocarburi)',
      '✓ Euro 3: CO max 0.3%, HC max 100 ppm',
      '✓ Euro 4-6: CO max 0.2%, Lambda: 0.97-1.03',
      '═══ MOTOARE DIESEL ═══',
      '✓ Se măsoară: OPACITATEA fumului (cât de "negru" iese)',
      '✓ Valoare: coeficient k exprimat în m⁻¹',
      '✓ Diesel aspirație naturală: max 2.5 m⁻¹',
      '✓ Diesel turbo (Euro 4+): max 1.5 m⁻¹',
      '✓ Motorul trebuie să fie la temperatura normală (min 80°C)',
      '═══ ELECTRIC / HIBRID ═══',
      '✓ ELECTRIC: NU se efectuează proba de poluare',
      '✓ HIBRID: Proba de poluare se face DOAR dacă motorul termic pornește în timpul ITP',
      '═══ OBFCM - Vehicule din 2021+ (Regulament UE 2021/392) ═══',
      '✓ Vehiculele cu prima înmatriculare după 01.01.2021 au dispozitiv OBFCM',
      '✓ OBFCM = On-Board Fuel Consumption Monitoring (monitorizare consum real)',
      '✓ Se aplică vehiculelor cu cod omologare AP, AQ sau AR în CIV',
      '✓ La ITP se citesc datele de consum real din calculatorul de bord',
      '⚠ CONSIMȚĂMÂNT: Aveți dreptul să REFUZAȚI transmiterea datelor către CE',
      '✓ Refuzul NU afectează rezultatul ITP - este opțional conform GDPR',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Scurgeri minore de ulei motor (pete, nu picurări active)',
      '⚠ Scurgeri ulei transmisie vizibile dar minore',
      '⚠ Țeava eșapament cu rugină superficială (dar etanșă)',
      '⚠ Suport motor cu uzură dar fără joc excesiv',
      '✗ MAJOR: DPF (filtru particule) anulat = RESPINGERE + AMENDĂ!',
    ],
  },
  {
    category: '8. ECHIPAMENTE OBLIGATORII',
    icon: FileCheck,
    color: 'orange',
    intro: 'Conform Codului Rutier (OUG 195/2002) și Regulamentului CEE-ONU R27',
    items: [
      '✓ Trusă medicală: Conform Ordinului MS 623/1999, completă și în termen',
      '✓ 2 triunghiuri reflectorizante: Omologate CEE-ONU R27 (marca E în cerc)',
      '✓ Stingător auto: În termen, conform Legii 307/2006',
      '✓ Vestă reflectorizantă: Obligatorie pentru vehicule > 3.5t și în afara localităților',
      '✓ Roată de rezervă SAU kit de reparație pană (omologat)',
      '✓ Cric și cheie de roți: Prezente și funcționale',
      '═══ DEFECTE MINORE (ADMIS cu observații) ═══',
      '⚠ Trusă medicală incompletă (lipsă articole neesențiale)',
      '⚠ Triunghi cu reflectorizare redusă (dar omologat)',
      '⚠ Stingător aproape de data expirării',
      '⚠ Vestă cu mici deteriorări (dar reflectorizantă)',
      '⚠ Cric funcțional dar cu uzură',
      '═══ SANCȚIUNI CONFORM COD RUTIER ═══',
      '⚠ Lipsa echipamentelor = Amendă 330-495 lei (clasa I)',
      '⚠ Circulație fără dotări obligatorii = Amendă până la 1.012 lei',
    ],
  },
];

// ===========================================
// CATEGORII DEFECTE CONFORM RNTR 1
// DMi = Deficiență Minoră (observație)
// DMa = Deficiență Majoră (respingere, 30 zile remediere)
// DP = Deficiență Periculoasă (respingere, fără drept de circulație!)
// ===========================================

const REJECTION_REASONS = [
  {
    reason: 'Frâne sub limită',
    description: 'Eficiență sub 50% sau dezechilibru peste 20% între roți. Mașina trage la frânare sau nu oprește în timp util.',
    severity: 'DP',
    severityLabel: 'PERICULOS',
  },
  {
    reason: 'Jocuri la direcție',
    description: 'Capete de bară, pivot sau bielete cu joc. Volanul nu răspunde imediat - risc de pierdere a controlului.',
    severity: 'DP',
    severityLabel: 'PERICULOS',
  },
  {
    reason: 'Coroziune structurală',
    description: 'Rugină străpunsă pe lonjeroane, praguri sau puncte de prindere suspensie. Șasiul este compromis.',
    severity: 'DP',
    severityLabel: 'PERICULOS',
  },
  {
    reason: 'Lumini nefuncționale',
    description: 'Faruri, stopuri, semnalizatoare arse sau lipsă. Un singur bec ars = respingere.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Anvelope neconforme',
    description: 'Profil sub 1.6mm, dimensiuni diferite de CIV, sau tăieturi/hernii vizibile pe flanc.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Emisii depășite',
    description: 'CO peste limită la benzină sau opacitate peste limită la diesel. DPF sau catalizator lipsă/anulat.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Parbriz fisurat',
    description: 'Fisuri sau crăpături în zona de baleiaj a ștergătoarelor (vizibilitate șofer).',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Martori de avarie aprinși',
    description: 'Check Engine, ABS, Airbag, ESP sau alte avertismente active în bord.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Scurgeri lichide',
    description: 'Pierderi vizibile de ulei motor, lichid de frână, antigel sau combustibil.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
  {
    reason: 'Centuri defecte',
    description: 'Centuri de siguranță care nu se blochează sau nu se retrag corect.',
    severity: 'DMa',
    severityLabel: 'MAJOR',
  },
];

export function HomePage() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<number | null>(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    vehiclePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
  });

  // Zile blocate din baza de date (admin)
  const [blockedDays, setBlockedDays] = useState<Holiday[]>([]);

  // Încarcă zilele blocate de la API
  useEffect(() => {
    const loadBlockedDays = async () => {
      try {
        const data = await holidaysService.getAll();
        setBlockedDays(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading blocked days:', err);
        setBlockedDays([]);
      }
    };
    loadBlockedDays();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedCategory) {
      loadSlots();
    }
  }, [selectedDate, selectedCategory]);

  const loadSlots = async () => {
    if (!selectedDate) return;

    try {
      setSlotsLoading(true);
      setSlotsError(null);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const category = VEHICLE_CATEGORIES.find(c => c.id === selectedCategory);
      const data = await appointmentsService.getAvailableSlots(dateStr, category?.duration || 30);

      if (!data.available) {
        setSlotsError(data.reason || 'Nu sunt intervale disponibile');
        setAvailableSlots([]);
      } else {
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlotsError('Eroare la încărcarea intervalelor');
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Verifică dacă data e blocată din baza de date (admin)
  const isBlockedDay = (date: Date): Holiday | undefined => {
    if (!Array.isArray(blockedDays)) return undefined;
    const dateStr = formatDateLocal(date);
    return blockedDays.find(h => h.date.split('T')[0] === dateStr);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (date.getDay() === 0) return true; // Duminică
    // Verifică sărbătorile ortodoxe cu cruce roșie
    const holidayCheck = isHoliday(date);
    if (holidayCheck.isHoliday) return true;
    // Verifică zilele blocate din admin
    if (isBlockedDay(date)) return true;
    return false;
  };

  // Obține numele sărbătorii sau motivul blocării pentru o dată (pentru tooltip)
  const getHolidayName = (date: Date): string | null => {
    // Mai întâi verifică zilele blocate din admin
    const blockedDay = isBlockedDay(date);
    if (blockedDay) return blockedDay.name;
    // Apoi verifică sărbătorile legale
    const holidayCheck = isHoliday(date);
    return holidayCheck.isHoliday ? holidayCheck.name || null : null;
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedDate || !selectedSlot) return;

    try {
      setSubmitting(true);
      const category = VEHICLE_CATEGORIES.find(c => c.id === selectedCategory);

      const dto: CreateAppointmentDto = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        vehiclePlate: formData.vehiclePlate.toUpperCase(),
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
        vehicleCategory: selectedCategory,
        serviceType: 'ITP',
        appointmentDate: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot,
        duration: category?.duration || 30,
      };

      const result = await appointmentsService.create(dto);
      setConfirmationCode(result.confirmationCode || null);
      setSuccess(true);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.message || 'Eroare la crearea programării');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setFormData({
      clientName: '',
      clientPhone: '',
      vehiclePlate: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
    });
    setSuccess(false);
    setConfirmationCode(null);
    setShowBookingForm(false);
  };

  const scrollToBooking = () => {
    setShowBookingForm(true);
    setTimeout(() => {
      document.getElementById('programare')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Programare Confirmată!</h2>
            <p className="text-gray-600 mb-6">
              Programarea dumneavoastră a fost înregistrată cu succes.
            </p>

            {confirmationCode && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-blue-600 mb-2">Cod de confirmare:</p>
                <p className="text-3xl font-mono font-bold text-blue-800">{confirmationCode}</p>
                <p className="text-sm text-gray-500 mt-2">Păstrați acest cod pentru referință</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Detalii programare:</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Data:</span> {selectedDate?.toLocaleDateString('ro-RO', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}</p>
                <p><span className="font-medium">Ora:</span> {selectedSlot}</p>
                <p><span className="font-medium">Vehicul:</span> {formData.vehiclePlate}</p>
                <p><span className="font-medium">Categoria:</span> {VEHICLE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Nu uitați să aduceți:</p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Cartea de identitate a vehiculului (CIV) - original</li>
                    <li>• Certificatul de înmatriculare (talonul)</li>
                    <li>• Asigurare RCA valabilă</li>
                    <li>• Act de identitate (pentru persoana care prezintă vehiculul)</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Programare Nouă
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MISEDA INSPECT</h1>
                <p className="text-blue-300 text-sm">Stație ITP Autorizată RAR - Rădăuți</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="/programarile-mele" className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors text-sm font-medium">
                <FileCheck size={18} />
                Verifică Programarea
              </a>
              <div className="text-right hidden md:block">
                <p className="text-sm text-blue-300">Pentru programări:</p>
                <a href="tel:0756596565" className="flex items-center justify-end gap-2 text-xl font-bold hover:text-blue-300">
                  <Phone size={20} />
                  <span>0756 596 565</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Inspecție Tehnică Periodică
          </h2>
          <p className="text-xl text-blue-200 mb-6 max-w-2xl mx-auto">
            Verificare conformă cu normele RAR. Programează-te online și vino pregătit!
          </p>
          <button
            onClick={scrollToBooking}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <Calendar className="inline mr-2" size={24} />
            Programează-te ACUM
          </button>
          <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock size={18} />
              <span>~30 minute</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <BadgeCheck size={18} />
              <span>Autorizat RAR</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users size={18} />
              <span>Inspector: AVRAM ADRIAN</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 mb-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Autoturisme</p>
              <p className="text-gray-500 text-sm">Categoria M1</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Autoutilitare</p>
              <p className="text-gray-500 text-sm">Categoria N1 ≤3.5t</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
            <div className="bg-orange-100 rounded-lg p-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">30 minute</p>
              <p className="text-gray-500 text-sm">Durată medie</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Experiență</p>
              <p className="text-gray-500 text-sm">Personal calificat</p>
            </div>
          </div>
        </div>
      </section>

      {/* IMPORTANT: Pre-ITP Checklist */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              📋 Pregătește-ți Mașina pentru ITP
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verifică aceste puncte <strong>ÎNAINTE</strong> să vii la stație pentru a evita respingerea și pierderea timpului. Un ITP reușit înseamnă o mașină pregătită corect!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {ITP_CHECKLIST.map((section, index) => {
              const Icon = section.icon;
              const isExpanded = expandedChecklist === index;
              const colorClasses: Record<string, string> = {
                yellow: 'bg-yellow-100 text-yellow-700',
                red: 'bg-red-100 text-red-700',
                blue: 'bg-blue-100 text-blue-700',
                gray: 'bg-gray-100 text-gray-700',
                cyan: 'bg-cyan-100 text-cyan-700',
                green: 'bg-green-100 text-green-700',
                purple: 'bg-purple-100 text-purple-700',
                orange: 'bg-orange-100 text-orange-700',
              };

              return (
                <div
                  key={section.category}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                >
                  <button
                    onClick={() => setExpandedChecklist(isExpanded ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClasses[section.color] || 'bg-gray-100 text-gray-700'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-800">{section.category}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {section.items.length} puncte
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      {/* Intro explicativ */}
                      {section.intro && (
                        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="italic">💡 {section.intro}</p>
                          {'legalLink' in section && section.legalLink && (
                            <a
                              href={section.legalLink as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-blue-700 hover:text-blue-900 underline font-medium not-italic"
                            >
                              📜 Vezi Regulamentul UE 2021/392 (text integral)
                            </a>
                          )}
                        </div>
                      )}
                      <ul className="space-y-2">
                        {section.items.map((item, i) => {
                          // Determine styling based on item prefix
                          const isDanger = item.startsWith('✗');
                          const isHeader = item.startsWith('═══');
                          const isOk = item.startsWith('✓');
                          const isMinorDefect = item.startsWith('⚠');

                          if (isHeader) {
                            return (
                              <li key={i} className="font-semibold text-gray-800 text-sm mt-4 pt-3 border-t-2 border-orange-300 bg-orange-50 p-2 rounded">
                                {item.replace(/═/g, '').trim()}
                              </li>
                            );
                          }

                          return (
                            <li key={i} className={`flex items-start gap-2 text-sm ${
                              isDanger ? 'text-red-700 bg-red-50 p-2 rounded-lg font-medium' :
                              isMinorDefect ? 'text-orange-700 bg-orange-50/50 p-1.5 rounded-lg' :
                              isOk ? 'text-gray-600' : 'text-gray-600'
                            }`}>
                              {isDanger ? (
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              ) : isMinorDefect ? (
                                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              ) : isOk ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              )}
                              <span>{item.substring(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand All Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => setExpandedChecklist(expandedChecklist === -1 ? null : -1)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {expandedChecklist === -1 ? 'Restrânge toate' : 'Expandează toate categoriile'}
            </button>
          </div>
        </div>
      </section>

      {/* Tire Requirements Section */}
      <section className="bg-slate-800 py-16 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">🛞 Cerințe pentru Anvelope</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-yellow-400" />
                Cerințe Obligatorii
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Profil minim 1.6mm</strong> - măsurat pe toată suprafața benzii de rulare</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Dimensiuni conforme cu CIV</strong> - verifică cartea vehiculului</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Aceleași anvelope pe axă</strong> - marcă, model și dimensiune identice</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Fără defecte vizibile</strong> - tăieturi, umflături, crăpături</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="text-blue-400" />
                Anvelope de Iarnă
              </h3>
              <div className="space-y-4">
                <p className="text-gray-300">
                  <strong className="text-white">Marcaj obligatoriu:</strong> M+S, M.S. sau M&S
                  (semnificație: Mud and Snow - Noroi și Zăpadă)
                </p>
                <p className="text-gray-300">
                  <strong className="text-white">Când sunt obligatorii:</strong> Pe drumurile acoperite cu zăpadă, gheață sau polei
                </p>
                <div className="bg-yellow-500/20 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200 text-sm">
                    <AlertCircle className="inline mr-2" size={16} />
                    <strong>Atenție:</strong> Anvelopele "all-season" trebuie să aibă marcajul M+S pentru a fi conforme!
                  </p>
                </div>
                <p className="text-gray-400 text-sm">
                  Amenda pentru nerespectare: 1.305 - 2.900 lei
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Rejection Reasons */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">
            ⚠️ Motive Frecvente de Respingere
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Aceste probleme sunt cel mai des întâlnite. Verifică-le înainte să vii!
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {REJECTION_REASONS.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl p-4 ${
                  item.severity === 'DP'
                    ? 'bg-red-50 border-2 border-red-300'
                    : 'bg-orange-50 border-2 border-orange-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className={`w-5 h-5 ${
                    item.severity === 'DP' ? 'text-red-500' : 'text-orange-500'
                  }`} />
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    item.severity === 'DP'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {item.severityLabel}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1 text-sm">{item.reason}</h4>
                <p className="text-gray-600 text-xs">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Explicație categorii defecte RNTR 1 */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-800 mb-2">DMi - Deficiență Minoră</h4>
              <p className="text-green-700 text-sm">Observație. Vehiculul trece ITP, dar se recomandă remedierea.</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h4 className="font-bold text-orange-800 mb-2">DMa - Deficiență Majoră</h4>
              <p className="text-orange-700 text-sm">RESPINS. Ai 30 de zile să remediezi și să revii la re-verificare.</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-bold text-red-800 mb-2">DP - Deficiență Periculoasă</h4>
              <p className="text-red-700 text-sm">RESPINS. Risc imediat pentru siguranța circulației.</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-xl p-6 text-center">
            <p className="text-blue-800">
              <strong>📋 Conform RNTR 1:</strong> Dacă ești respins (DMa sau DP), ITP-ul nu mai este valabil.
              Ai 30 de zile să remediezi problemele și să revii la aceeași stație pentru re-verificare.
            </p>
          </div>
        </div>
      </section>

      {/* Documents Required */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            📄 Documente Necesare
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-4 text-green-700 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documente Obligatorii
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Cartea de Identitate a Vehiculului (CIV)</strong>
                    <p className="text-gray-500 text-sm">Original - documentul gri/verde</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Certificatul de Înmatriculare</strong>
                    <p className="text-gray-500 text-sm">Talonul mașinii</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Asigurare RCA Valabilă</strong>
                    <p className="text-gray-500 text-sm">Polița în vigoare</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Act de Identitate</strong>
                    <p className="text-gray-500 text-sm">Al persoanei care prezintă vehiculul</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-4 text-blue-700 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Informații Importante
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Seria de șasiu (VIN) trebuie să fie vizibilă și lizibilă</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Numărul motorului trebuie să corespundă cu CIV</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Plăcuțele de înmatriculare trebuie să fie lizibile</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Vehiculul trebuie să fie curat pentru identificare</span>
                </li>
              </ul>

              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-800 text-sm">
                  <AlertTriangle className="inline mr-1" size={16} />
                  <strong>Atenție:</strong> Fără aceste documente, ITP-ul nu poate fi efectuat!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RAR Blocking Info */}
      <section className="bg-amber-500 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="text-xl font-bold mb-2">Ce este Blocarea RAR?</h3>
              <p className="text-amber-100 mb-3">
                Registrul Auto Român (RAR) poate selecta <strong>aleatoriu</strong> orice vehicul pentru
                o re-verificare suplimentară în prezența unui inspector RAR. Această procedură este
                <strong> obligatorie și nu poate fi refuzată</strong>.
              </p>
              <ul className="text-amber-100 space-y-1 text-sm">
                <li>• Timpul de așteptare poate crește cu 15-45 minute</li>
                <li>• Se reverificăfrânele, emisiile și alte sisteme</li>
                <li>• Procedura asigură calitatea inspecțiilor ITP</li>
                <li>• În cazul blocării, vă rugăm să aveți răbdare</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      {showBookingForm && (
        <section className="bg-gradient-to-b from-slate-100 to-white py-16" id="programare">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              📅 Programare Online ITP
            </h2>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Progress Steps */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {s}
                      </div>
                      {s < 3 && (
                        <div className={`w-16 md:w-24 h-1 mx-2 ${
                          step > s ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-gray-500">
                  <span>Categorie</span>
                  <span>Data & Ora</span>
                  <span>Detalii</span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Step 1: Category Selection */}
                {step === 1 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                      Selectați categoria vehiculului
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {VEHICLE_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setStep(2);
                            }}
                            className={`p-6 rounded-xl border-2 text-left transition-all hover:border-blue-500 hover:shadow-lg ${
                              selectedCategory === category.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="bg-blue-100 rounded-lg p-3">
                                <Icon className="w-8 h-8 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-lg">{category.label}</h4>
                                <p className="text-gray-500 text-sm mt-1">{category.description}</p>
                                <p className="text-blue-600 text-sm mt-2 font-medium">
                                  <Clock size={14} className="inline mr-1" />
                                  ~{category.duration} minute
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {step === 2 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                      Alegeți data și ora
                    </h3>

                    {/* Calendar */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h4 className="font-semibold text-gray-700">
                          {MONTHS_RO[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h4>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS_RO.map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} className="h-12" />;
                          }

                          const disabled = isDateDisabled(date);
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          const isToday = date.toDateString() === new Date().toDateString();
                          const holidayName = getHolidayName(date);
                          const isSunday = date.getDay() === 0;

                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => !disabled && setSelectedDate(date)}
                              disabled={disabled}
                              title={holidayName || (isSunday ? 'Duminică - Închis' : '')}
                              className={`h-12 rounded-lg font-medium transition-colors relative ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : isToday
                                  ? 'bg-blue-100 text-blue-600'
                                  : holidayName
                                  ? 'bg-red-100 text-red-400 cursor-not-allowed'
                                  : isSunday
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                  : disabled
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {date.getDate()}
                              {holidayName && (
                                <span className="absolute top-0.5 right-0.5 text-red-500 text-xs">✝</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">
                          Intervale disponibile pentru {selectedDate.toLocaleDateString('ro-RO', {
                            weekday: 'long', day: 'numeric', month: 'long'
                          })}:
                        </h4>

                        {slotsLoading ? (
                          <div className="text-center py-8 text-gray-500">Se încarcă intervalele...</div>
                        ) : slotsError ? (
                          <div className="text-center py-8 text-red-500">{slotsError}</div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">Nu sunt intervale disponibile</div>
                        ) : (
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {availableSlots.map((slot) => {
                              // Verifică dacă slotul a trecut deja (pentru ziua curentă)
                              const isPassed = selectedDate ? isTimeSlotPassed(selectedDate, slot.time) : false;
                              const isAvailable = slot.available && !isPassed;

                              return (
                                <button
                                  key={slot.time}
                                  onClick={() => isAvailable && setSelectedSlot(slot.time)}
                                  disabled={!isAvailable}
                                  title={isPassed ? 'Ora a trecut deja' : ''}
                                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedSlot === slot.time
                                      ? 'bg-blue-600 text-white'
                                      : isPassed
                                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                      : isAvailable
                                      ? 'bg-gray-100 hover:bg-blue-100 text-gray-700'
                                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setStep(1)}
                        className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                      >
                        Înapoi
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!selectedDate || !selectedSlot}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continuă
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Details Form */}
                {step === 3 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                      Completați datele
                    </h3>

                    <div className="space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nume și prenume *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.clientName}
                          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ion Popescu"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Număr de telefon *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.clientPhone}
                          onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0722 123 456"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Număr înmatriculare *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.vehiclePlate}
                          onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          placeholder="SV 01 ABC"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marcă
                          </label>
                          <input
                            type="text"
                            value={formData.vehicleMake}
                            onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Dacia"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model
                          </label>
                          <input
                            type="text"
                            value={formData.vehicleModel}
                            onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Logan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            An fabricație
                          </label>
                          <input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            value={formData.vehicleYear}
                            onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2020"
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 mt-6">
                        <h4 className="font-medium text-gray-800 mb-2">Rezumat programare:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Serviciu:</span> ITP - {VEHICLE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
                          <p><span className="font-medium">Data:</span> {selectedDate?.toLocaleDateString('ro-RO', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          })}</p>
                          <p><span className="font-medium">Ora:</span> {selectedSlot}</p>
                          <p><span className="font-medium">Durată estimată:</span> ~30 minute</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                      >
                        Înapoi
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.clientName || !formData.clientPhone || !formData.vehiclePlate}
                        className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Se procesează...' : 'Confirmă Programarea'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA if booking form not visible */}
      {!showBookingForm && (
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ești pregătit pentru ITP?
            </h2>
            <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
              Ai verificat toate punctele de mai sus? Atunci programează-te acum și vino cu mașina pregătită!
            </p>
            <button
              onClick={scrollToBooking}
              className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Calendar className="inline mr-2" size={24} />
              Programează-te Online
            </button>
          </div>
        </section>
      )}

      {/* Contact & Location */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="text-blue-400" />
                MISEDA INSPECT SRL
              </h3>
              <p className="text-gray-400 mb-4">
                Stație ITP autorizată RAR pentru autoturisme și autoutilitare.
                Servicii profesionale de inspecție tehnică periodică.
              </p>
              <p className="text-blue-400 font-medium">
                Inspector: AVRAM ADRIAN
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <div className="space-y-3">
                <a href="tel:0756596565" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <Phone className="text-green-400" size={20} />
                  <span>0756 596 565 - Adrian</span>
                </a>
                <a href="tel:0745025533" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <Phone className="text-green-400" size={20} />
                  <span>0745 025 533 - Vasile</span>
                </a>
                <div className="flex items-start gap-3 text-gray-300">
                  <MapPin className="text-red-400 mt-1" size={20} />
                  <span>Strada Izvoarelor 5<br />Rădăuți 725400, Suceava</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Program</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Luni - Vineri:</span>
                  <span className="text-white font-medium">08:00 - 17:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Sâmbătă:</span>
                  <span className="text-white font-medium">08:00 - 13:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Duminică:</span>
                  <span className="text-red-400">Închis</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href="/programarile-mele"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
                >
                  <FileCheck size={16} />
                  Verifică Programarea
                </a>
                <br />
                <a
                  href="https://maps.google.com/?q=Strada+Izvoarelor+5+Radauti+Suceava"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <MapPin size={16} />
                  Deschide în Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-gray-500 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} MISEDA INSPECT SRL. Toate drepturile rezervate.</p>
          <p className="mt-2 text-gray-600">
            Informațiile de pe acest site sunt conforme cu reglementările RAR și legislația în vigoare.
          </p>
        </div>
      </footer>
    </div>
  );
}
