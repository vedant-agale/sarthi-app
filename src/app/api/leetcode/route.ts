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
        variables: { username: username.trim(), limit: 20 },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    const submissions = data?.data?.recentAcSubmissionList || [];

    if (submissions.length === 0) {
      return NextResponse.json({ verified: false, message: 'LeetCode profile par koi AC submission nahi mila!' });
    }

    const now = Date.now();
    const getISTDate = (ms: number) =>
      new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayIST = getISTDate(now);

    // Dual-Check: Pichle 24 ghante me solve hua ho YA aaj ki IST date ho
    const verifiedSub = submissions.find((sub: any) => {
      const subTime = parseInt(sub.timestamp) * 1000;
      const diffHours = (now - subTime) / (1000 * 60 * 60);
      const isToday = getISTDate(subTime) === todayIST;
      return diffHours <= 24 || isToday;
    });

    if (verifiedSub) {
      return NextResponse.json({
        verified: true,
        problem: verifiedSub.title,
        message: `Verified! Solve mil gaya: "${verifiedSub.title}" 🔥`
      });
    } else {
      const latest = submissions[0];
      const hoursAgo = Math.round((now - parseInt(latest.timestamp) * 1000) / (1000 * 60 * 60));
      return NextResponse.json({
        verified: false,
        message: `Aakhri solve "${latest.title}" lagbhag ${hoursAgo} ghante pehle ka tha. Aaj ka fresh solve nahi mila!`
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'LeetCode se contact nahi ho saka' }, { status: 500 });
  }
}