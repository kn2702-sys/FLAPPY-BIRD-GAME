import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const scores = await db.gameScore.findMany({
      orderBy: { score: 'desc' },
      take: 10,
    });
    return NextResponse.json(scores);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, playerName } = body;

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const newScore = await db.gameScore.create({
      data: {
        score,
        playerName: playerName?.slice(0, 20) || 'Player',
      },
    });

    return NextResponse.json(newScore, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
