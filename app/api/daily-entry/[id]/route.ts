import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: entry, error } = await supabase
      .from('daily_entries')
      .select(`
        *,
        op_income:daily_op_income(*, doctor:doctors(*)),
        lab_income:daily_lab_income(*, doctor:doctors(*)),
        pharmacy_income:daily_pharmacy_income(*, doctor:doctors(*)),
        obs_income:daily_obs_income(*, doctor:doctors(*)),
        home_care_income:daily_home_care_income(*, doctor:doctors(*)),
        expense_lines:daily_expense_lines(*, expense_head:expense_heads(*))
      `)
      .eq('id', id)
      .single();

    if (error || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const { data: userClinic } = await supabase
      .from('user_clinics')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('clinic_id', (entry as any).clinic_id)
      .maybeSingle();

    if (!userClinic) {
      return NextResponse.json(
        { error: 'Access denied to this clinic' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
 
  try {

    const { id } = params;
    const body = await request.json();
    const {
      opening_balance_cash,
      opening_balance_bank,
      notes,
      status,
      op_income = [],
      lab_income = [],
      pharmacy_income = [],
      obs_income = [],
      home_care_income = [],
      expense_lines = [],
    } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    await (supabase.from('daily_op_income') as any).delete().eq('daily_entry_id', id);
    await (supabase.from('daily_lab_income') as any).delete().eq('daily_entry_id', id);
    await (supabase.from('daily_pharmacy_income') as any).delete().eq('daily_entry_id', id);
    await (supabase.from('daily_obs_income') as any).delete().eq('daily_entry_id', id);
    await (supabase.from('daily_home_care_income') as any).delete().eq('daily_entry_id', id);
    await (supabase.from('daily_expense_lines') as any).delete().eq('daily_entry_id', id);

    const updateData: any = {};
    if (opening_balance_cash !== undefined) updateData.opening_balance_cash = opening_balance_cash;
    if (opening_balance_bank !== undefined) updateData.opening_balance_bank = opening_balance_bank;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await (supabase
        .from('daily_entries') as any)
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }
    console.log('op_income',op_income);
    if (op_income.length > 0) {
      const opIncomeData = op_income.map((line: any) => ({
        daily_entry_id: id,
        doctor_id: line.doctor_id,
        rate: line.rate || null,
        cash_quantity: line.cash_quantity || null,
        gp_quantity: line.gp_quantity || null,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      const { error: opError } = await (supabase.from('daily_op_income') as any).insert(opIncomeData);
      if (opError) {
        return NextResponse.json({ error: `OP Income error: ${opError.message}` }, { status: 500 });
      }
    }

    if (lab_income.length > 0) {
      const labIncomeData = lab_income.map((line: any) => ({
        daily_entry_id: id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_lab_income') as any).insert(labIncomeData);
    }

    if (pharmacy_income.length > 0) {
      const pharmacyIncomeData = pharmacy_income.map((line: any) => ({
        daily_entry_id: id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_pharmacy_income') as any).insert(pharmacyIncomeData);
    }

    if (obs_income.length > 0) {
      const obsIncomeData = obs_income.map((line: any) => ({
        daily_entry_id: id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_obs_income') as any).insert(obsIncomeData);
    }

    if (home_care_income.length > 0) {
      const homeCareIncomeData = home_care_income.map((line: any) => ({
        daily_entry_id: id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_home_care_income') as any).insert(homeCareIncomeData);
    }

    if (expense_lines.length > 0) {
      const expenseLinesData = expense_lines.map((line: any, index: number) => ({
        daily_entry_id: id,
        seq_no: line.seq_no || index + 1,
        expense_head_id: line.expense_head_id || null,
        description: line.description || '',
        cash_amount: line.cash_amount || 0,
        bank_amount: line.bank_amount || 0,
      }));

      await (supabase.from('daily_expense_lines') as any).insert(expenseLinesData);
    }

    const { data: updatedEntry } = await supabase
      .from('daily_entries')
      .select(`
        *,
        op_income:daily_op_income(*, doctor:doctors(*)),
        lab_income:daily_lab_income(*, doctor:doctors(*)),
        pharmacy_income:daily_pharmacy_income(*, doctor:doctors(*)),
        obs_income:daily_obs_income(*, doctor:doctors(*)),
        home_care_income:daily_home_care_income(*, doctor:doctors(*)),
        expense_lines:daily_expense_lines(*, expense_head:expense_heads(*))
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({ data: updatedEntry });
  } catch (error) {
    console.error('Error updating daily entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
