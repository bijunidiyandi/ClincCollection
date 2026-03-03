import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/check-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { authorized, supabase } = await checkSuperAdmin(token);

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, role');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const { data: userClinics, error: clinicsError } = await supabase
      .from('user_clinics')
      .select(`
        user_id,
        clinic_id,
        clinics (
          id,
          code,
          name
        )
      `);

    if (clinicsError) {
      return NextResponse.json({ error: clinicsError.message }, { status: 500 });
    }

    const userMap = new Map();
    usersData?.forEach((user: any) => {
      userMap.set(user.id, {
        id: user.id,
        role: user.role,
        clinics: [],
      });
    });

    userClinics?.forEach((uc: any) => {
      if (userMap.has(uc.user_id)) {
        userMap.get(uc.user_id).clinics.push({
          clinic_id: uc.clinic_id,
          clinic: uc.clinics,
        });
      }
    });

    const userList = Array.from(userMap.values());

    return NextResponse.json({ data: userList });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { authorized, supabase } = await checkSuperAdmin(token);

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, clinic_id, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      const { error: userError } = await (supabase
        .from('users') as any)
        .insert({
          id: data.user.id,
          role,
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      if (clinic_id) {
        const { error: assignError } = await (supabase
          .from('user_clinics') as any)
          .insert({
            user_id: data.user.id,
            clinic_id,
          });

        if (assignError) {
          console.error('Error assigning clinic:', assignError);
        }
      }
    }

    return NextResponse.json({ data: { id: data.user?.id, email: data.user?.email } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
