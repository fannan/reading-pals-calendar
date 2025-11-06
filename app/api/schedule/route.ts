import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://tasks.sklabs.app/webhook/ec50065d-398b-4bfc-adaa-5378d8b444ea';

export async function GET() {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache, always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`N8N webhook returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schedule from N8N:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
