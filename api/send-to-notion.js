import { Client } from "@notionhq/client";
import { Clerk } from '@clerk/clerk-sdk-node';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ message: "未授权的访问：缺少凭证" });
  }

  const databaseId = req.headers['x-database-id'];
  if (!databaseId) {
    return res.status(400).json({ message: "缺少数据库ID" });
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    const claims = await clerk.verifyToken(token);
    const userId = claims.sub;
    const user = await clerk.users.getUser(userId);

    const { properties, children } = req.body;
    const submitterName = user.username || userId;

    const propertiesWithUser = {
        ...properties,
        "上报人": {
            "rich_text": [{ "type": "text", "text": { "content": submitterName } }]
        }
    };

    const homeTeam = properties["主场"]?.select?.name;
    const awayTeam = properties["客场"]?.select?.name;

    if (!homeTeam || !awayTeam) {
        return res.status(400).json({ message: "缺少主队或客队信息" });
    }

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

    if (response.results.length > 0) {
      const pageId = response.results[0].id;
      
      await notion.pages.update({
        page_id: pageId,
        properties: propertiesWithUser,
      });

      const blocksToAppend = [
        {
          "object": "block",
          "type": "divider",
          "divider": {}
        },
        {
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              { "type": "text", "text": { "content": `追加提交人：${submitterName}` } }
            ]
          }
        },
        {
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              { "type": "text", "text": { "content": "追加提交时间：" } },
              {
                "type": "mention",
                "mention": {
                  "type": "date",
                  "date": {
                    "start": new Date().toISOString()
                  }
                }
              }
            ]
          }
        },
        ...children 
      ];

      await notion.blocks.children.append({
        block_id: pageId,
        children: blocksToAppend,
      });

      res.status(200).json({ message: `用户 ${submitterName} 的赛果已成功更新！` });

    } else {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: propertiesWithUser,
        children: children,
      });

      res.status(201).json({ message: `用户 ${submitterName} 的赛果已成功记录！` });
    }

  } catch (error) {
    console.error("请求失败详情:", error);
    if (error.code === 'validation_error') {
        return res.status(400).json({ message: "提交到 Notion 的数据验证失败，请检查数据库字段是否匹配。", error: error.body });
    }
    if (error.code === 'unauthorized') {
      return res.status(403).json({ message: "未授权", error: error.body });
    }
    res.status(500).json({ message: "服务器出错了", error: error.body || error.message });
  }
}