import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const date = searchParams.get('date');

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      );
    }

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

    const { data: userClinic } = await supabase
      .from('user_clinics')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (!userClinic) {
      return NextResponse.json(
        { error: 'Access denied to this clinic' },
        { status: 403 }
      );
    }

    let query = supabase
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
      .eq('clinic_id', clinicId)
      .order('entry_date', { ascending: false });

    if (date) {
      query = query.eq('entry_date', date);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinic_id,
      entry_date,
      opening_balance_cash = 0,
      opening_balance_bank = 0,
      notes = '',
      status = 'DRAFT',
      op_income = [],
      lab_income = [],
      pharmacy_income = [],
      obs_income = [],
      home_care_income = [],
      expense_lines = [],
    } = body;

    if (!clinic_id || !entry_date) {
      return NextResponse.json(
        { error: 'clinic_id and entry_date are required' },
        { status: 400 }
      );
    }
   console.log('POST' );
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
console.log('Authenticated user ID  →', user.id);
console.log('Submitted clinic_id   →', clinic_id);
console.log('Token subject (just in case) →', user.id); // redundant but harmless
    const { data: userClinic } = await supabase
      .from('user_clinics')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('clinic_id', clinic_id)
      .maybeSingle();

    if (!userClinic) {
      return NextResponse.json(
        { error: 'Access denied to this clinic' },
        { status: 403 }
      );
    }

    const role = (userClinic as any).role;
    if (role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot create entries' },
        { status: 403 }
      );
    }

    const { data: existingEntry } = await supabase
      .from('daily_entries')
      .select('id')
      .eq('clinic_id', clinic_id)
      .eq('entry_date', entry_date)
      .maybeSingle();

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Entry already exists for this date' },
        { status: 409 }
      );
    }

    const { data: newEntry, error: entryError } = await (supabase
      .from('daily_entries') as any)
      .insert({
        clinic_id,
        entry_date,
        opening_balance_cash,
        opening_balance_bank,
        notes,
        status,
        created_by: user.id,
      })
      .select()
      .single();

    if (entryError) {
      return NextResponse.json({ error: entryError.message }, { status: 500 });
    }

    if (op_income.length > 0) {
      const opIncomeData = op_income.map((line: any) => ({
        daily_entry_id: newEntry.id,
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
        daily_entry_id: newEntry.id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_lab_income') as any).insert(labIncomeData);
    }

    if (pharmacy_income.length > 0) {
      const pharmacyIncomeData = pharmacy_income.map((line: any) => ({
        daily_entry_id: newEntry.id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_pharmacy_income') as any).insert(pharmacyIncomeData);
    }

    if (obs_income.length > 0) {
      const obsIncomeData = obs_income.map((line: any) => ({
        daily_entry_id: newEntry.id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_obs_income') as any).insert(obsIncomeData);
    }

    if (home_care_income.length > 0) {
      const homeCareIncomeData = home_care_income.map((line: any) => ({
        daily_entry_id: newEntry.id,
        doctor_id: line.doctor_id,
        cash_amount: line.cash_amount || 0,
        gpay_amount: line.gpay_amount || 0,
        discount: line.discount || 0,
      }));
      await (supabase.from('daily_home_care_income') as any).insert(homeCareIncomeData);
    }

    if (expense_lines.length > 0) {
      const expenseLinesData = expense_lines.map((line: any, index: number) => ({
        daily_entry_id: newEntry.id,
        seq_no: line.seq_no || index + 1,
        expense_head_id: line.expense_head_id || null,
        description: line.description || '',
        cash_amount: line.cash_amount || 0,
        bank_amount: line.bank_amount || 0,
      }));

      await (supabase.from('daily_expense_lines') as any).insert(expenseLinesData);
    }

    const { data: completeEntry } = await supabase
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
      .eq('id', newEntry.id)
      .single();

    return NextResponse.json({ data: completeEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating daily entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
