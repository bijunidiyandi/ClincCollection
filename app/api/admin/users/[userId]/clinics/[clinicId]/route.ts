import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/check-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; clinicId: string } }
) {
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

    const { error } = await supabase
      .from('user_clinics')
      .delete()
      .eq('user_id', params.userId)
      .eq('clinic_id', params.clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
