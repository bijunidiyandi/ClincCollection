import type { DailyDoctorLine, DailyExpenseLine, DailyOPIncome, DailyLabIncome, DailyPharmacyIncome, DailyOBSIncome, DailyHomeCareIncome } from './db/types';

export interface DailyEntryCalculations {
  totalIncomeCash: number;
  totalIncomeBank: number;
  totalExpenseCash: number;
  totalExpenseBank: number;
  closingBalanceCash: number;
  closingBalanceBank: number;
  grandTotal: number;
}

export function calculateTotals(
  doctorLines: DailyDoctorLine[],
  expenseLines: DailyExpenseLine[],
  openingBalanceCash: number = 0,
  openingBalanceBank: number = 0
): DailyEntryCalculations {
  const totalIncomeCash = doctorLines.reduce(
    (sum, line) =>
      sum +
      (line.op_cash || 0) +
      (line.lab_cash || 0) +
      (line.pharmacy_cash || 0) +
      (line.obs_cash || 0) +
      (line.home_care_cash || 0),
    0
  );

  const totalIncomeBank = doctorLines.reduce(
    (sum, line) =>
      sum +
      (line.op_gpay || 0) +
      (line.lab_gpay || 0) +
      (line.pharmacy_gpay || 0) +
      (line.obs_gpay || 0) +
      (line.home_care_gpay || 0),
    0
  );

  const totalDiscount = doctorLines.reduce((sum, line) => sum + (line.discount || 0), 0);

  const totalExpenseCash = expenseLines.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const totalExpenseBank = expenseLines.reduce((sum, line) => sum + (line.bank_amount || 0), 0);

  const closingBalanceCash = openingBalanceCash + totalIncomeCash - totalExpenseCash;
  const closingBalanceBank = openingBalanceBank + totalIncomeBank - totalExpenseBank;
  const grandTotal = closingBalanceCash + closingBalanceBank;

  return {
    totalIncomeCash,
    totalIncomeBank,
    totalExpenseCash,
    totalExpenseBank,
    closingBalanceCash,
    closingBalanceBank,
    grandTotal,
  };
}

interface IncomeLineSimple {
  cash_amount: number;
  gpay_amount: number;
  discount: number;
}

export function calculateTotalsNew(
  opIncome: IncomeLineSimple[],
  labIncome: IncomeLineSimple[],
  pharmacyIncome: IncomeLineSimple[],
  obsIncome: IncomeLineSimple[],
  homeCareIncome: IncomeLineSimple[],
  expenseLines: DailyExpenseLine[],
  openingBalanceCash: number = 0,
  openingBalanceBank: number = 0
): DailyEntryCalculations {
  const opIncomeCash = opIncome.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const opIncomeBank = opIncome.reduce((sum, line) => sum + (line.gpay_amount || 0), 0);

  const labIncomeCash = labIncome.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const labIncomeBank = labIncome.reduce((sum, line) => sum + (line.gpay_amount || 0), 0);

  const pharmacyIncomeCash = pharmacyIncome.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const pharmacyIncomeBank = pharmacyIncome.reduce((sum, line) => sum + (line.gpay_amount || 0), 0);

  const obsIncomeCash = obsIncome.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const obsIncomeBank = obsIncome.reduce((sum, line) => sum + (line.gpay_amount || 0), 0);

  const homeCareIncomeCash = homeCareIncome.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const homeCareIncomeBank = homeCareIncome.reduce((sum, line) => sum + (line.gpay_amount || 0), 0);

  const totalIncomeCash = opIncomeCash + labIncomeCash + pharmacyIncomeCash + obsIncomeCash + homeCareIncomeCash;
  const totalIncomeBank = opIncomeBank + labIncomeBank + pharmacyIncomeBank + obsIncomeBank + homeCareIncomeBank;

  const totalExpenseCash = expenseLines.reduce((sum, line) => sum + (line.cash_amount || 0), 0);
  const totalExpenseBank = expenseLines.reduce((sum, line) => sum + (line.bank_amount || 0), 0);

  const closingBalanceCash = openingBalanceCash + totalIncomeCash - totalExpenseCash;
  const closingBalanceBank = openingBalanceBank + totalIncomeBank - totalExpenseBank;
  const grandTotal = closingBalanceCash + closingBalanceBank;

  return {
    totalIncomeCash,
    totalIncomeBank,
    totalExpenseCash,
    totalExpenseBank,
    closingBalanceCash,
    closingBalanceBank,
    grandTotal,
  };
}
