'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { getSelectedClinic } from '@/lib/clinic';
import { calculateTotalsNew } from '@/lib/cashbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save } from 'lucide-react';
import type { Doctor, ExpenseHead } from '@/lib/db/types';

interface IncomeLineInput {
  id?: string;
  doctor_id: string;
  rate?: number;
  cash_quantity?: number;
  gp_quantity?: number;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
}

interface ExpenseLineInput {
  id?: string;
  seq_no: number;
  expense_head_id: string | null;
  description: string;
  cash_amount: number;
  bank_amount: number;
}

interface EntryFormProps {
  entryId?: string;
  initialData?: {
    entry_date: string;
    opening_balance_cash: number;
    opening_balance_bank: number;
    notes: string;
    status: string;
    op_income: IncomeLineInput[];
    lab_income: IncomeLineInput[];
    pharmacy_income: IncomeLineInput[];
    obs_income: IncomeLineInput[];
    home_care_income: IncomeLineInput[];
    expense_lines: ExpenseLineInput[];
  };
}

export function EntryForm({ entryId, initialData }: EntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);

  const [entryDate, setEntryDate] = useState(initialData?.entry_date || new Date().toISOString().split('T')[0]);
  const [openingBalanceCash, setOpeningBalanceCash] = useState(initialData?.opening_balance_cash || 0);
  const [openingBalanceBank, setOpeningBalanceBank] = useState(initialData?.opening_balance_bank || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');

  const [opIncome, setOpIncome] = useState<IncomeLineInput[]>(initialData?.op_income || []);
  const [labIncome, setLabIncome] = useState<IncomeLineInput[]>(initialData?.lab_income || []);
  const [pharmacyIncome, setPharmacyIncome] = useState<IncomeLineInput[]>(initialData?.pharmacy_income || []);
  const [obsIncome, setObsIncome] = useState<IncomeLineInput[]>(initialData?.obs_income || []);
  const [homeCareIncome, setHomeCareIncome] = useState<IncomeLineInput[]>(initialData?.home_care_income || []);
  const [expenseLines, setExpenseLines] = useState<ExpenseLineInput[]>(initialData?.expense_lines || []);

  useEffect(() => {
    loadMasterData();
  }, []);
useEffect(() => {
  console.log("expenseLines changed →", expenseLines);
}, [expenseLines]);
  async function loadMasterData() {
    const clinic = getSelectedClinic();
    if (!clinic) return;

    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('active', true)
      .order('name');

    const { data: expenseHeadsData } = await supabase
      .from('expense_heads')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('active', true)
      .order('name');

    setDoctors(doctorsData || []);
    setExpenseHeads(expenseHeadsData || []);
  }

  function addIncomeLine(type: 'op' | 'lab' | 'pharmacy' | 'obs' | 'home_care') {
    if (doctors.length === 0) {
      alert('Please add doctors first before creating income entries. Go to Admin > Doctors to add doctors.');
      return;
    }

    const selectedDoctor = doctors[0];
    const newLine: IncomeLineInput = {
      doctor_id: selectedDoctor.id,
      rate: type === 'op' ? (selectedDoctor.rate || 0) : undefined,
      cash_quantity: type === 'op' ? 0 : undefined,
      gp_quantity: type === 'op' ? 0 : undefined,
      cash_amount: 0,
      gpay_amount: 0,
      discount: 0,
    };

    switch (type) {
      case 'op':
        setOpIncome([...opIncome, newLine]);
        break;
      case 'lab':
        setLabIncome([...labIncome, newLine]);
        break;
      case 'pharmacy':
        setPharmacyIncome([...pharmacyIncome, newLine]);
        break;
      case 'obs':
        setObsIncome([...obsIncome, newLine]);
        break;
      case 'home_care':
        setHomeCareIncome([...homeCareIncome, newLine]);
        break;
    }
  }


  function removeIncomeLine(type: 'op' | 'lab' | 'pharmacy' | 'obs' | 'home_care', index: number) {
    switch (type) {
      case 'op':
        setOpIncome(opIncome.filter((_, i) => i !== index));
        break;
      case 'lab':
        setLabIncome(labIncome.filter((_, i) => i !== index));
        break;
      case 'pharmacy':
        setPharmacyIncome(pharmacyIncome.filter((_, i) => i !== index));
        break;
      case 'obs':
        setObsIncome(obsIncome.filter((_, i) => i !== index));
        break;
      case 'home_care':
        setHomeCareIncome(homeCareIncome.filter((_, i) => i !== index));
        break;
    }
  }

  function updateIncomeLine(type: 'op' | 'lab' | 'pharmacy' | 'obs' | 'home_care', index: number, field: keyof IncomeLineInput, value: any) {
    const updateArray = (arr: IncomeLineInput[]) => {
      const updated = [...arr];
      updated[index] = { ...updated[index], [field]: value };

      // For OP income, auto-calculate amounts based on rate and quantities
      if (type === 'op') {
        const line = updated[index];
        const rate = line.rate || 0;
        const cashQty = line.cash_quantity || 0;
        const gpQty = line.gp_quantity || 0;

        // Update doctor_id should also update rate
        if (field === 'doctor_id') {
          const doctor = doctors.find(d => d.id === value);
          if (doctor) {
            updated[index].rate = doctor.rate || 0;
            updated[index].cash_amount = (doctor.rate || 0) * cashQty;
            updated[index].gpay_amount = (doctor.rate || 0) * gpQty;
          }
        } else if (field === 'rate' || field === 'cash_quantity' || field === 'gp_quantity') {
          updated[index].cash_amount = (field === 'rate' ? value : rate) * (field === 'cash_quantity' ? value : cashQty);
          updated[index].gpay_amount = (field === 'rate' ? value : rate) * (field === 'gp_quantity' ? value : gpQty);
        }
      }

      return updated;
    };

    switch (type) {
      case 'op':
        setOpIncome(updateArray(opIncome));
        break;
      case 'lab':
        setLabIncome(updateArray(labIncome));
        break;
      case 'pharmacy':
        setPharmacyIncome(updateArray(pharmacyIncome));
        break;
      case 'obs':
        setObsIncome(updateArray(obsIncome));
        break;
      case 'home_care':
        setHomeCareIncome(updateArray(homeCareIncome));
        break;
    }
  }
function addExpenseLine() {
  const currentSeqNos = expenseLines.map(l => l.seq_no);
  const nextSeq = currentSeqNos.length === 0 
    ? 1 
    : Math.max(...currentSeqNos) + 1;

  setExpenseLines([
    ...expenseLines,
    {
      id: undefined,                   // new line → no id yet
      seq_no: nextSeq,
      expense_head_id: null,
      description: '',
      cash_amount: 0,
      bank_amount: 0,
    },
  ]);
}

function removeExpenseLine(index: number) {
  const updated = expenseLines.filter((_, i) => i !== index);
  
  // Optional: re-number seq_no sequentially
  const renumbered = updated.map((line, idx) => ({
    ...line,
    seq_no: idx + 1,
  }));

  setExpenseLines(renumbered);
}

  function updateExpenseLine(index: number, field: keyof ExpenseLineInput, value: any) {
    const updated = [...expenseLines];
    updated[index] = { ...updated[index], [field]: value };
    setExpenseLines(updated);
  }

  const totals = calculateTotalsNew(
    opIncome,
    labIncome,
    pharmacyIncome,
    obsIncome,
    homeCareIncome,
    expenseLines as any,
    openingBalanceCash,
    openingBalanceBank
  );

  async function handleSubmit() {
    try {
      setLoading(true);
      const clinic = getSelectedClinic();
      if (!clinic) return;

      const { data: { session } } = await supabase.auth.getSession();
 
      if (!session) return;

      const payload = {
        clinic_id: clinic.id,
        entry_date: entryDate,
        opening_balance_cash: openingBalanceCash,
        opening_balance_bank: openingBalanceBank,
        notes,
        status,
        op_income: opIncome,
        lab_income: labIncome,
        pharmacy_income: pharmacyIncome,
        obs_income: obsIncome,
        home_care_income: homeCareIncome,
        expense_lines: expenseLines,
      };

      const url = entryId ? `/api/daily-entry/${entryId}` : '/api/daily-entry';
      const method = entryId ? 'PUT' : 'POST';
console.log('Sending expense_lines to backend:', 
  expenseLines.map(l => ({
    id: l.id,
    seq_no: l.seq_no,
    description: l.description,
    cash: l.cash_amount,
    bank: l.bank_amount
  }))
);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
 
       console.log('response -fetch',response)
      if (response.ok) {
        router.push('/app/daily-entry');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    } finally {
      setLoading(false);
    }
  }

  const renderIncomeSection = (
    title: string,
    type: 'op' | 'lab' | 'pharmacy' | 'obs' | 'home_care',
    lines: IncomeLineInput[]
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={() => addIncomeLine(type)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                {type === 'op' && (
                  <>
                    <TableHead>Rate</TableHead>
                    <TableHead>Cash Qty</TableHead>
                    <TableHead>GP Qty</TableHead>
                  </>
                )}
                <TableHead>Cash Amount</TableHead>
                <TableHead>GPay Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={line.doctor_id}
                      onValueChange={(value) => updateIncomeLine(type, index, 'doctor_id', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {type === 'op' && (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.rate || 0}
                          onChange={(e) => updateIncomeLine(type, index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          value={line.cash_quantity || 0}
                          onChange={(e) => updateIncomeLine(type, index, 'cash_quantity', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          value={line.gp_quantity || 0}
                          onChange={(e) => updateIncomeLine(type, index, 'gp_quantity', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.cash_amount}
                      onChange={(e) => updateIncomeLine(type, index, 'cash_amount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                      disabled={type === 'op'}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.gpay_amount}
                      onChange={(e) => updateIncomeLine(type, index, 'gpay_amount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                      disabled={type === 'op'}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.discount}
                      onChange={(e) => updateIncomeLine(type, index, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncomeLine(type, index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderIncomeSectionMobile = (
    title: string,
    type: 'op' | 'lab' | 'pharmacy' | 'obs' | 'home_care',
    lines: IncomeLineInput[]
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button onClick={() => addIncomeLine(type)} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lines.map((line, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Label>Doctor</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIncomeLine(type, index)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              <Select
                value={line.doctor_id}
                onValueChange={(value) => updateIncomeLine(type, index, 'doctor_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {type === 'op' && (
                <>
                  <div>
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.rate || 0}
                      onChange={(e) => updateIncomeLine(type, index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cash Quantity</Label>
                      <Input
                        type="number"
                        step="1"
                        value={line.cash_quantity || 0}
                        onChange={(e) => updateIncomeLine(type, index, 'cash_quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">GP Quantity</Label>
                      <Input
                        type="number"
                        step="1"
                        value={line.gp_quantity || 0}
                        onChange={(e) => updateIncomeLine(type, index, 'gp_quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Cash Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.cash_amount}
                    onChange={(e) => updateIncomeLine(type, index, 'cash_amount', parseFloat(e.target.value) || 0)}
                    disabled={type === 'op'}
                  />
                </div>
                <div>
                  <Label className="text-xs">GPay Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.gpay_amount}
                    onChange={(e) => updateIncomeLine(type, index, 'gpay_amount', parseFloat(e.target.value) || 0)}
                    disabled={type === 'op'}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.discount}
                  onChange={(e) => updateIncomeLine(type, index, 'discount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryDate">Entry Date</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="openingCash">Opening Balance (Cash)</Label>
              <Input
                id="openingCash"
                type="number"
                step="0.01"
                value={openingBalanceCash}
                onChange={(e) => setOpeningBalanceCash(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="openingBank">Opening Balance (Bank)</Label>
              <Input
                id="openingBank"
                type="number"
                step="0.01"
                value={openingBalanceBank}
                onChange={(e) => setOpeningBalanceBank(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block space-y-6">
        {renderIncomeSection('Doctor Income (OP)', 'op', opIncome)}
        {renderIncomeSection('Lab Income', 'lab', labIncome)}
        {renderIncomeSection('Pharmacy Income', 'pharmacy', pharmacyIncome)}
        {renderIncomeSection('OBS Income', 'obs', obsIncome)}
        {renderIncomeSection('Home Care Income', 'home_care', homeCareIncome)}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            <Button onClick={addExpenseLine} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense Head</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cash Amount</TableHead>
                  <TableHead>Bank Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseLines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={line.expense_head_id || 'none'}
                        onValueChange={(value) => updateExpenseLine(index, 'expense_head_id', value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {expenseHeads.map((head) => (
                            <SelectItem key={head.id} value={head.id}>
                              {head.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateExpenseLine(index, 'description', e.target.value)}
                        className="w-64"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.cash_amount}
                        onChange={(e) => updateExpenseLine(index, 'cash_amount', parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.bank_amount}
                        onChange={(e) => updateExpenseLine(index, 'bank_amount', parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseLine(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="op">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="op">OP</TabsTrigger>
            <TabsTrigger value="lab">Lab</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mt-2">
            <TabsTrigger value="obs">OBS</TabsTrigger>
            <TabsTrigger value="home_care">Home Care</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="op">
            {renderIncomeSectionMobile('Doctor Income (OP)', 'op', opIncome)}
          </TabsContent>
          <TabsContent value="lab">
            {renderIncomeSectionMobile('Lab Income', 'lab', labIncome)}
          </TabsContent>
          <TabsContent value="pharmacy">
            {renderIncomeSectionMobile('Pharmacy Income', 'pharmacy', pharmacyIncome)}
          </TabsContent>
          <TabsContent value="obs">
            {renderIncomeSectionMobile('OBS Income', 'obs', obsIncome)}
          </TabsContent>
          <TabsContent value="home_care">
            {renderIncomeSectionMobile('Home Care Income', 'home_care', homeCareIncome)}
          </TabsContent>
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expenses</CardTitle>
                <Button onClick={addExpenseLine} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseLines.map((line, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Label>Expense Head</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpenseLine(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <Select
                        value={line.expense_head_id || 'none'}
                        onValueChange={(value) => updateExpenseLine(index, 'expense_head_id', value === 'none' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {expenseHeads.map((head) => (
                            <SelectItem key={head.id} value={head.id}>
                              {head.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateExpenseLine(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Cash Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.cash_amount}
                            onChange={(e) => updateExpenseLine(index, 'cash_amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Bank Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.bank_amount}
                            onChange={(e) => updateExpenseLine(index, 'bank_amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Cash in Hand</div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.closingBalanceCash.toFixed(2)}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Cash in Bank</div>
              <div className="text-2xl font-bold text-blue-600">
                ${totals.closingBalanceBank.toFixed(2)}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Grand Total</div>
              <div className="text-2xl font-bold">
                ${totals.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Income (Cash)</div>
              <div className="font-semibold">${totals.totalIncomeCash.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Income (Bank)</div>
              <div className="font-semibold">${totals.totalIncomeBank.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Expense (Cash)</div>
              <div className="font-semibold">${totals.totalExpenseCash.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Expense (Bank)</div>
              <div className="font-semibold">${totals.totalExpenseBank.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/app/daily-entry')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}
