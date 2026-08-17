// 微信读书 CORS 中转 Worker
// 用途：浏览器（GitHub Pages）无法直接跨域访问 i.weread.qq.com，
//       本 Worker 在服务端转发请求并加回 CORS 头，绕开浏览器跨域限制。
// 部署：Cloudflare Dashboard → Workers & Pages → Create Worker → 粘贴本文件 → Deploy
//       然后把你的 *.workers.dev 地址填进 workspace.html 的微信读书 Worker 配置。
//
// 安全：本 Worker 不存储任何 API Key。Key 由浏览器在 Authorization: Bearer 头中传入，
//       仅原样转发给微信读书网关。Worker 代码本身不含凭据，可放心提交到仓库。

const TARGET = 'https://i.weread.qq.com/api/agent/gateway';

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin');
    const allowOrigin = origin && origin !== 'null' ? origin : '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ errcode: -1, errmsg: 'Only POST allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 校验浏览器带来的鉴权头（防止空 Key 滥用）
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ errcode: -2, errmsg: 'Missing Authorization Bearer' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 透传 body 与鉴权头到微信读书网关
    let body;
    try {
      body = await request.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ errcode: -3, errmsg: 'Bad request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let upstream;
    try {
      upstream = await fetch(TARGET, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
        },
        body,
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ errcode: -4, errmsg: 'Upstream error: ' + e.message }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const respBody = await upstream.text();
    return new Response(respBody, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      },
    });
  },
};
