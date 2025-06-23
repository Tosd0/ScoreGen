import { Client } from "@notionhq/client";
import { Clerk } from '@clerk/clerk-sdk-node';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ message: "未授权的访问：缺少凭证" });
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    const claims = await clerk.verifyToken(token);
    const userId = claims.sub;

    const { properties, children } = req.body;

    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
      children: children,
    });

    res.status(201).json({ message: `用户 ${userId} 的赛果已成功记录！` });

  } catch (error) {
    console.error(error);
    if (error.message.includes('Token is invalid')) {
        return res.status(401).json({ message: "凭证无效" });
    }
    res.status(500).json({ message: "服务器出错了", error: error.body || error.message });
  }
}