import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { properties, children } = req.body;

    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
      children: children,
    });

    res.status(201).json({ message: "赛果已成功记录到 Notion！" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器出错了", error: error.body || error.message });
  }
}