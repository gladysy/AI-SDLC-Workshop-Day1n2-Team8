// Get holidays for a calendar month (PRP 10)
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { holidayDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let holidays;
    if (year && month) {
      holidays = holidayDB.findByMonth(Number(year), Number(month));
    } else {
      holidays = holidayDB.findAll();
    }

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('Error in /api/holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}
