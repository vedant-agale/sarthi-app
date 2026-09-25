import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username zaroori hai' }, { status: 400 });
  }

  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        timestamp
      }
    }
  `;

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { username, limit: 5 },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    const submissions = data?.data?.recentAcSubmissionList || [];

    if (submissions.length === 0) {
      return NextResponse.json({ verified: false, message: 'LeetCode par koi accepted submission nahi mila!' });
    }

    // Convert to Indian Standard Time (IST) Date comparison
    const getISTDate = (timestampMs: number) =>
      new Date(timestampMs).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const todayIST = getISTDate(Date.now());
    const todaySub = submissions.find((sub: any) => {
      const subIST = getISTDate(parseInt(sub.timestamp) * 1000);
      return subIST === todayIST;
    });

    if (todaySub) {
      return NextResponse.json({
        verified: true,
        problem: todaySub.title,
        message: `Verified! Aaj ka solve mil gaya: "${todaySub.title}" 🔥`
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: 'Purane submissions hain, par AAJ ka koi fresh question solve nahi mila! Pehle code karo.'
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'LeetCode connect nahi ho saka' }, { status: 500 });
  }
}