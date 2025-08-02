import { Client } from "@notionhq/client";
import { Clerk } from '@clerk/clerk-sdk-node';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

async function verifyAuth(token) {
  try {
    const claims = await clerk.verifyToken(token);
    const userId = claims.sub;
    await clerk.users.getUser(userId);
    return { valid: true };
  } catch (clerkError) {
    try {
      const validTokensData = process.env.VALID_TOKENS;
      if (validTokensData) {
        const validTokens = JSON.parse(validTokensData);
        const tokenInfo = validTokens[token];
        
        if (tokenInfo) {
          if (tokenInfo.expires && new Date() > new Date(tokenInfo.expires)) {
            throw new Error('Token expired');
          }
          return { valid: true };
        }
      }
    } catch (tokenError) {
      // ignore token error and let it fall through to the main error
    }
    
    throw new Error('Invalid authentication token');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ message: "未授权的访问：缺少凭证" });
  }

  const databaseId = req.query.databaseId;
  if (!databaseId) {
    return res.status(400).json({ message: "缺少数据库ID" });
  }

  const homeTeam = req.query.homeTeam;
  const awayTeam = req.query.awayTeam;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ message: "缺少主队或客队信息" });
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    await verifyAuth(token);

    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            "and": [
                {
                    "property": "主场",
                    "select": {
                        "equals": homeTeam
                    }
                },
                {
                    "property": "客场",
                    "select": {
                        "equals": awayTeam
                    }
                }
            ]
        }
    });

    res.status(200).json({ exists: response.results.length > 0 });

  } catch (error) {
    console.error("请求失败详情:", error);
    if (error.message === 'Invalid authentication token') {
        return res.status(401).json({ message: "未授权的访问：凭证无效" });
    }
    res.status(500).json({ message: "服务器出错了", error: error.message });
  }
}
