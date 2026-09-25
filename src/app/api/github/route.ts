import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  try {
    // 1. GitHub ke actual Contribution Heatmap ko check karo (Private commits included if enabled)
    const contribRes = await fetch(`https://github.com/users/${username.trim()}/contributions`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      cache: 'no-store',
    });

    if (contribRes.ok) {
      const html = await contribRes.text();
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const todayUTC = new Date().toISOString().split('T')[0];

      // Agar data-level 1, 2, 3 ya 4 hai matlab green box ban chuka hai!
      const pattern = new RegExp(
        `data-date=["'](?:${todayIST}|${todayUTC})["'][^>]*data-level=["']([1-4])["']|data-level=["']([1-4])["'][^>]*data-date=["'](?:${todayIST}|${todayUTC})["']`,
        'i'
      );

      if (pattern.test(html)) {
        return NextResponse.json({
          verified: true,
          message: 'Verified! Aaj ka GitHub heatmap green ho chuka hai 🚀'
        });
      }
    }

    // 2. Fallback check: Public events API
    const eventsRes = await fetch(`https://api.github.com/users/${username.trim()}/events`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'SARTHI-App' },
      cache: 'no-store',
    });

    if (eventsRes.ok) {
      const events = await eventsRes.json();
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const now = Date.now();

      const todayPush = Array.isArray(events) && events.find((ev: any) => {
        if (ev.type !== 'PushEvent') return false;
        const evTime = new Date(ev.created_at).getTime();
        const diffHours = (now - evTime) / (1000 * 60 * 60);
        return diffHours <= 24 || new Date(ev.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === todayIST;
      });

      if (todayPush) {
        return NextResponse.json({
          verified: true,
          message: `Verified! Push detect hua: ${todayPush.repo?.name || 'repo'} 🚀`
        });
      }
    }

    return NextResponse.json({
      verified: false,
      message: 'Aaj ka commit heatmap me nahi dikha. Profile par "Private contributions" setting ON karein!'
    });
  } catch (err) {
    return NextResponse.json({ error: 'GitHub check fail hua' }, { status: 500 });
  }
}