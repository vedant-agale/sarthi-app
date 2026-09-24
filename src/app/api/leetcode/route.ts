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
        variables: { username, limit: 1 },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    const submissions = data?.data?.recentAcSubmissionList || [];

    if (submissions.length === 0) {
      return NextResponse.json({ verified: false, message: 'Koi submission nahi mila!' });
    }

    // Check if the latest submission was today (last 24 hours)
    const latestSubTime = parseInt(submissions[0].timestamp) * 1000;
    const now = Date.now();
    const isToday = (now - latestSubTime) < (24 * 60 * 60 * 1000);

    return NextResponse.json({
      verified: isToday,
      problem: submissions[0].title,
      message: isToday 
        ? `Submission mil gaya: "${submissions[0].title}"! Sahi jaa rahe ho!` 
        : 'Aaj ka koi fresh submission nahi mila. Pehle question solve kar!'
    });
  } catch (err) {
    return NextResponse.json({ error: 'LeetCode se connect nahi ho paya' }, { status: 500 });
  }
}