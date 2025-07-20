export default async function handler(req, res) {
    // 启用 CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: '令牌不能为空' });
        }

        // 获取环境变量中的有效令牌数据
        const validTokensData = process.env.VALID_TOKENS;
        
        if (!validTokensData) {
            console.error('VALID_TOKENS environment variable not found');
            return res.status(500).json({ error: '服务器配置错误' });
        }

        let validTokens;
        try {
            validTokens = JSON.parse(validTokensData);
        } catch (parseError) {
            console.error('Invalid JSON in VALID_TOKENS:', parseError);
            return res.status(500).json({ error: '服务器配置错误' });
        }

        // 验证令牌
        const tokenInfo = validTokens[token];
        
        if (!tokenInfo) {
            return res.status(401).json({ error: '无效的访问令牌' });
        }

        // 检查令牌是否过期
        if (tokenInfo.expires && new Date() > new Date(tokenInfo.expires)) {
            return res.status(401).json({ error: '令牌已过期' });
        }

        // 返回用户信息
        res.status(200).json({
            success: true,
            user: {
                id: tokenInfo.userId || `token-user-${token.slice(0, 8)}`,
                username: tokenInfo.username,
                email: tokenInfo.email || `${tokenInfo.username}@token.local`,
                firstName: tokenInfo.firstName || tokenInfo.username,
                lastName: tokenInfo.lastName || ''
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: '令牌验证失败' });
    }
}