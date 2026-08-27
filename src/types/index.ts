export interface CaseItem {
  id: string;
  itemNo: string;
  patientName: string;
  surgeon: string;
  anesth: string;
  imPediaGp: string;
  remarks: string;
  totalAmount: number;
  forPool: number;
  balance: number;
  surgeonShare: number;
  anesthShare: number;
  im?: number;
  pedia?: number;
  hemo?: number;
  hemoIm?: number;
  providerTotal?: number;
  afterPoolProvider?: number;
  afterImPedia?: number;
  month?: string;
  isArchived?: boolean;
}

export interface ClaimItem {
  pabn: string;
  series: string;
  pin: string;
  patientName: string;
  period: string;
  totalGross: number;
  wtax: number;
  hci: number;
  pf: number;
  doctors: string[];
  status: string;
}

export interface DoctorSummaryItem {
  doctorName: string;
  specialty: string;
  totalCases: number;
  grossPf: number;
  wtax20: number;
  netPf: number;
}

export interface DoctorHourShare {
  name: string;
  role: string;
  status: string;
  hours: number;
  share: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'billing' | 'doctor' | 'staff';
  doctorName?: string;
  permissions?: string[];
  status: 'active' | 'inactive';
}