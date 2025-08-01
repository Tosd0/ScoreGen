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

  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ message: "未授权的访问：缺少凭证" });
  }

  const { databaseId } = req.query;
  if (!databaseId) {
    return res.status(400).json({ message: "缺少数据库ID参数" });
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    await verifyAuth(token);

    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    let title = '未命名数据库';
    if (database && database.title && database.title.length > 0) {
      title = database.title.map(t => t.plain_text || '').join('');
    }

    res.status(200).json({ 
      valid: true,
      title: title
    });

  } catch (error) {
    console.error("验证数据库ID失败:", error);
    
    if (error.code === 'object_not_found') {
      return res.status(404).json({ 
        valid: false,
        message: "数据库不存在或无权访问" 
      });
    }
    
    res.status(500).json({ 
      valid: false,
      message: "验证数据库ID时出错",
      error: error.message 
    });
  }
} 