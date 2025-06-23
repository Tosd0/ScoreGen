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

    const clerkUser = await clerk.users.getUser(userId);

    const emailsToTry = [];
    
    const notionVerifiedEmail = clerkUser.emailAddresses.find(
      e => e.verification?.strategy === 'from_oauth_notion'
    )?.emailAddress;
    if (notionVerifiedEmail) {
      emailsToTry.push(notionVerifiedEmail);
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      e => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;
    if (primaryEmail && !emailsToTry.includes(primaryEmail)) {
      emailsToTry.push(primaryEmail);
    }
    
    if (emailsToTry.length === 0) {
      return res.status(400).json({ message: "无法从Clerk获取任何有效的用户邮箱地址。" });
    }

    const notionUsersResponse = await notion.users.list({});
    const notionUsers = notionUsersResponse.results;

    let notionPerson = null;
    for (const email of emailsToTry) {
      notionPerson = notionUsers.find(
        (user) => user.type === "person" && user.person.email === email
      );
      if (notionPerson) break;
    }
      
    if (!notionPerson) {
      return res.status(400).json({ 
        message: `在Notion中找不到任何匹配的用户。尝试过的邮箱: [${emailsToTry.join(', ')}]。请确认Clerk和Notion使用相同的邮箱，并且机器人有读取用户的权限。` 
      });
    }
    
    const notionPersonId = notionPerson.id;
    const { properties, children } = req.body;

    const propertiesWithUser = {
        ...properties,
        "裁判": {
            "people": [{ "object": "user", "id": notionPersonId }]
        },
        "上报人": {
            "people": [{ "object": "user", "id": notionPersonId }]
        }
    };

    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: propertiesWithUser,
      children: children,
    });

    res.status(201).json({ message: `用户 ${notionPerson.person.email} 的赛果已成功记录！` });

  } catch (error) {
    console.error("请求失败详情:", error);
    if (error.code === 'validation_error') {
        return res.status(400).json({ message: "提交到 Notion 的数据验证失败，请检查数据库字段是否匹配。", error: error.body });
    }
    if (error.code === 'unauthorized') {
      return res.status(403).json({ message: "机器人无权执行此操作。请检查是否已授予'读取用户'权限。", error: error.body });
    }
    res.status(500).json({ message: "服务器出错了", error: error.body || error.message });
  }
}