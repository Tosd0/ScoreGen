import { Client } from "@notionhq/client";
import { Clerk } from '@clerk/clerk-sdk-node';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

async function verifyAuth(token) {
  // First try to verify as Clerk token
  try {
    await clerk.verifyToken(token);
    return { type: 'clerk', valid: true };
  } catch (clerkError) {
    // If Clerk verification fails, try token verification
    try {
      const validTokensData = process.env.VALID_TOKENS;
      if (validTokensData) {
        const validTokens = JSON.parse(validTokensData);
        const tokenInfo = validTokens[token];
        
        if (tokenInfo) {
          // Check if token is expired
          if (tokenInfo.expires && new Date() > new Date(tokenInfo.expires)) {
            throw new Error('Token expired');
          }
          return { type: 'token', valid: true, tokenInfo };
        }
      }
    } catch (tokenError) {
      // Token verification also failed
    }
    
    // Both verification methods failed
    throw new Error('Invalid authentication token');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { databaseId } = req.query;
  if (!databaseId) {
    return res.status(400).json({ message: "缺少数据库ID" });
  }

  try {
    const token = req.headers.authorization.replace('Bearer ', '');
    await verifyAuth(token);

    let allTeams = new Set();
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
            page_size: 100,
        });

        response.results.forEach(page => {
            const homeTeam = page.properties['主场']?.select?.name;
            const awayTeam = page.properties['客场']?.select?.name;
            if (homeTeam) allTeams.add(homeTeam);
            if (awayTeam) allTeams.add(awayTeam);
        });

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    res.status(200).json({ teams: Array.from(allTeams).sort() });

  } catch (error) {
    console.error("获取队伍列表失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
}