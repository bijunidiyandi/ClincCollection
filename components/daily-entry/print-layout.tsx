'use client';

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface PrintLayoutProps {
  entry: any;
  clinic: any;
  userId: string;
}

export function PrintLayout({ entry, clinic , userId}: PrintLayoutProps) {
  const totals = calculateTotals(entry);

  return (
    <div className="print-layout p-8 bg-white text-black">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-layout, .print-layout * {
            visibility: visible;
          }
          .print-layout {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{clinic?.name || 'Clinic'}</h1>
        <p className="text-sm text-gray-600">{clinic?.address}</p>
        <p className="text-sm text-gray-600">Phone: {clinic?.phone}</p>
        <h2 className="text-xl font-semibold mt-4">Daily Cashbook Entry</h2>
        <p className="text-sm">Date: {new Date(entry.entry_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })}</p>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="font-semibold">Opening Balance (Cash): {entry.opening_balance_cash?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="font-semibold">Opening Balance (Bank): {entry.opening_balance_bank?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {entry.op_income?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">OP Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Cash Qty</TableHead>
                <TableHead className="text-right">GP Qty</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">GPay</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.op_income.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.doctor?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{line.rate || '-'}</TableCell>
                  <TableCell className="text-right">{line.cash_quantity || '-'}</TableCell>
                  <TableCell className="text-right">{line.gp_quantity || '-'}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.gpay_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.discount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.gpay_amount - line.discount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entry.lab_income?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Lab Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">GPay</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lab_income.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.doctor?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.gpay_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.discount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.gpay_amount - line.discount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entry.pharmacy_income?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Pharmacy Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">GPay</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.pharmacy_income.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.doctor?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.gpay_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.discount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.gpay_amount - line.discount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entry.obs_income?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">OBS Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">GPay</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.obs_income.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.doctor?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.gpay_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.discount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.gpay_amount - line.discount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entry.home_care_income?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Home Care Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">GPay</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.home_care_income.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.doctor?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.gpay_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.discount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.gpay_amount - line.discount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entry.expense_lines?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Expenses</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Head</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Bank</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.expense_lines.map((line: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{line.expense_head?.name || 'N/A'}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{line.cash_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.bank_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(line.cash_amount + line.bank_amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Separator className="my-6" />

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-green-700">Total Income (Cash): {totals.totalIncomeCash.toFixed(2)}</p>
            <p className="font-semibold text-green-700">Total Income (GPay): {totals.totalIncomeGPay.toFixed(2)}</p>
            <p className="font-semibold text-green-700">Total Income: {totals.totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-semibold text-red-700">Total Expenses (Cash): {totals.totalExpenseCash.toFixed(2)}</p>
            <p className="font-semibold text-red-700">Total Expenses (Bank): {totals.totalExpenseBank.toFixed(2)}</p>
            <p className="font-semibold text-red-700">Total Expenses: {totals.totalExpense.toFixed(2)}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-lg">Closing Balance (Cash): {totals.closingBalanceCash.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-bold text-lg">Closing Balance (Bank): {totals.closingBalanceBank.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="font-bold text-xl text-blue-700">Net Closing Balance: {totals.netClosingBalance.toFixed(2)}</p>
        </div>
      </div>

      {entry.notes && (
        <div className="mt-6">
          <p className="font-semibold">Notes:</p>
          <p className="text-sm text-gray-700">{entry.notes}</p>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Printed on {new Date().toLocaleString('en-IN')} by {userId}</p>
      </div>
    </div>
  );
}

function calculateTotals(entry: any) {
  const totalIncomeCash =
    (entry.op_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
    (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
    (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
    (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
    (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0);

  const totalIncomeGPay =
    (entry.op_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
    (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
    (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
    (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
    (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0);

  const totalDiscounts =
    (entry.op_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
    (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
    (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
    (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
    (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0);

  const totalIncome = totalIncomeCash + totalIncomeGPay - totalDiscounts;

  const totalExpenseCash = entry.expense_lines?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0;
  const totalExpenseBank = entry.expense_lines?.reduce((sum: number, line: any) => sum + (line.bank_amount || 0), 0) || 0;
  const totalExpense = totalExpenseCash + totalExpenseBank;

  const closingBalanceCash = (entry.opening_balance_cash || 0) + totalIncomeCash - totalExpenseCash;
  const closingBalanceBank = (entry.opening_balance_bank || 0) + totalIncomeGPay - totalExpenseBank;
  const netClosingBalance = closingBalanceCash + closingBalanceBank;

  return {
    totalIncomeCash,
    totalIncomeGPay,
    totalIncome,
    totalExpenseCash,
    totalExpenseBank,
    totalExpense,
    closingBalanceCash,
    closingBalanceBank,
    netClosingBalance,
  };
}
