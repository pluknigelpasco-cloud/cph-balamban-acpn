export interface ClaimItem {
  pabn: string;
  series: string;
  pin: string;
  patientName: string;
  period: string;
  caserate1?: { code: string; gross: number };
  caserate2?: { code: string; gross: number };
  others?: { code: string; gross: number };
  totalGross: number;
  wtax: number;
  hci: number;
  pf: number;
  doctors: string[];
  status: string;
}

export interface CaseItem {
  id: string;
  itemNo: string;
  patientName: string;
  surgeon: string;
  anesth: string;
  imPediaGp: string;
  remarks: string;
  provider: number;
  btlFp: number;
  totalAmount: number;
  forPool: number;
  balance: number;
  providerTotal: number;
  providerShare: number;
  teamShare: number;
  icu: number;
  nicu: number;
  perinat: number;
  afterPoolProvider: number;
  pedia: number;
  im: number;
  afterImPedia: number;
  surgeonShare: number;
  anesthShare: number;
  hemo: number;
  hemoIm: number;
}

export interface PmCase {
  itemNo: string;
  patientName: string;
  surgeon: string;
  anesth: string;
  remarks: string;
  totalAmount: number;
  forPool: number;
  balance: number;
}

export interface DoctorHourShare {
  name: string;
  role: string;
  status: string;
  hours: number;
  share: number;
}

export interface BtlShare {
  doctor: string;
  amount: number;
  equalShare: number;
}

export interface DoctorSummaryItem {
  doctorName: string;
  specialty: string;
  totalCases: number;
  grossPf: number;
  wtax20: number;
  netPf: number;
  medicalShare: number;
  nonMedicalShare: number;
}