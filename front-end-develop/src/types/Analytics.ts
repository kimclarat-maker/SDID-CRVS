export interface DailyBiometricEntry {
  date: string;
  total: number;
  startDate?: string;
  endDate?: string;
}

export interface DayOfWeekBiometricEntry {
  date: string;
  total: number;
  startDate?: string;
  endDate?: string;
}

export interface DailyBiometrics {
  dailyBiometrics: DailyBiometricEntry[];
}

export interface MonthlyBiometricEntry {
  date: string;
  startDate: string;
  endDate: string;
  total: number;
  trend?: string;
  color?: string;
}

export interface CenterBiometricEntry {
  center: string;
  centerId: string | null;
  total: number;
  color: string;
  icon: string;
}

export interface BiometricsData {
  totalBiometricsCaptured: number;
  completedToday: number;
  totalRollBacks: number;
  missedAppointments: number;
  dailyBiometrics: DailyBiometrics;
  monthlyBiometrics: MonthlyBiometricEntry[];
  totalFemale: number;
  totalMale: number;
  total: number;
  centerBiometrics: CenterBiometricEntry[];
  dayOfWeeks: DayOfWeekBiometricEntry[];
}

export type GETParameters = {
  startDate: string;
  endDate: string;
  status?: string;
  province?: string[];
  center?: string[];
  [key: string]: any;
};
