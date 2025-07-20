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

  const { databaseId, team } = req.query;
  if (!databaseId || !team) {
    return res.status(400).json({ message: "缺少必要参数" });
  }

  try {
    const token = req.headers.authorization.replace('Bearer ', '');
    await verifyAuth(token);

    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            or: [
                { property: "主场", select: { equals: team } },
                { property: "客场", select: { equals: team } }
            ]
        }
    });
    
    const resultsWithChildren = await Promise.all(response.results.map(async (page) => {
        const childrenResponse = await notion.blocks.children.list({ block_id: page.id });
        return { ...page, children: childrenResponse.results };
    }));

    res.status(200).json({ results: resultsWithChildren });

  } catch (error) {
    console.error(`查询队伍 "${team}" 赛果失败:`, error);
    res.status(500).json({ message: "服务器内部错误" });
  }
}