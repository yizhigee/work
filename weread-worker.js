// 工作台统一后端网关（Cloudflare Worker）
// 职责：替前端保管 GitHub PAT 与微信读书 Key —— 前端零 token、零 localStorage 密钥。
// 端点：
//   GET    /api/data     读取 data.json（返回 {ok,data,sha}；404 返回空数据）
//   PUT    /api/data     写入 data.json（body {data,sha} → 返回 {ok,sha}）
//   POST   /api/weread   微信读书同步（body 即网关请求，Worker 注入 Key 后转发）
//   PUT    /api/image    上传图片（body {path,content(base64)}）
//   DELETE /api/image    删除图片（body {path}，Worker 内部取 sha 后删）
//   GET    /            健康检查（返回 github / weread 配置就绪状态）
//   GET    /debug       临时诊断端点（暴露 env 就绪状态与真实 GitHub 调用结果，不泄露 PAT 明文）
//
// 安全：GitHub PAT、微信读书 Key、APP_KEY 全部来自 Cloudflare 环境变量（后台设置），
//   不进仓库、不下发前端、不写源码。APP_KEY 为轻量闸门，仅挡随机滥用（非有权限凭证）。
// 部署：Cloudflare Dashboard → Workers → 选择 weread-proxy 这个 Worker → 粘贴本文件 → Deploy；
//   并在 Settings → Variables 添加环境变量 GITHUB_PAT / WEREAD_KEY / GITHUB_OWNER /
//   GITHUB_REPO / GITHUB_BRANCH / GITHUB_DATA_FILE / APP_KEY。

const GITHUB_API = 'https://api.github.com';

function makeCors(origin) {
  const allow = origin && origin !== 'null' ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function checkGate(request, env) {
  if (!env.APP_KEY) return true; // 未配置闸门则放行（fail-open）
  const h = request.headers.get('x-app-key') ||
            new URL(request.url).searchParams.get('appkey') || '';
  return h === env.APP_KEY;
}

function ghHeaders(env, extra) {
  return Object.assign(
    { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + (env.GITHUB_PAT || '') },
    extra || {}
  );
}

function ghContentsUrl(env, path) {
  return GITHUB_API + '/repos/' + (env.GITHUB_OWNER || 'yizhigee') + '/' +
         (env.GITHUB_REPO || 'work') + '/contents/' + path;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function withCors(resp, cors) {
  for (const k in cors) resp.headers.set(k, cors[k]);
  return resp;
}

// 真实校验 PAT 能否访问目标仓库：
//   200 = 文件存在且 token 可用；404 = 文件不存在但 token/权限可用；401/403 = token 失效或权限不足。
async function checkGithub(env) {
  try {
    const url = ghContentsUrl(env, env.GITHUB_DATA_FILE || 'data.json') + '?ref=' + (env.GITHUB_BRANCH || 'main');
    const r = await fetch(url, { headers: ghHeaders(env) });
    return r.status === 200 || r.status === 404;
  } catch (e) {
    return false;
  }
}

// 临时诊断端点：不泄露 PAT 明文，只暴露长度、GitHub 真实响应状态等。
async function handleDebug(request, env) {
  const checkUrl = ghContentsUrl(env, env.GITHUB_DATA_FILE || 'data.json') + '?ref=' + (env.GITHUB_BRANCH || 'main');
  let ghStatus = null;
  let ghErr = null;
  let ghRespText = '';
  try {
    const r = await fetch(checkUrl, { headers: ghHeaders(env) });
    ghStatus = r.status;
    ghRespText = await r.text().catch(function () { return ''; });
  } catch (e) {
    ghErr = e.message;
  }
  const pat = env.GITHUB_PAT || '';
  const key = env.WEREAD_KEY || '';
  return json({
    ok: true,
    note: 'diagnostic endpoint: lengths and github status only, no secrets exposed',
    env: {
      github_owner: env.GITHUB_OWNER || '',
      github_repo: env.GITHUB_REPO || '',
      github_branch: env.GITHUB_BRANCH || '',
      github_data_file: env.GITHUB_DATA_FILE || '',
      app_key_set: !!env.APP_KEY,
      github_pat_length: pat.length,
      github_pat_prefix: pat.length > 11 ? pat.slice(0, 11) : '',
      github_pat_suffix: pat.length > 6 ? pat.slice(-6) : '',
      weread_key_length: key.length,
      weread_key_prefix: key.length > 4 ? key.slice(0, 4) : '',
    },
    github_check: {
      url: checkUrl,
      status: ghStatus,
      error: ghErr,
      response_preview: ghRespText.slice(0, 200),
    },
  });
}

async function handleData(request, env) {
  const path = env.GITHUB_DATA_FILE || 'data.json';
  const branch = env.GITHUB_BRANCH || 'main';
  if (request.method === 'GET') {
    const r = await fetch(ghContentsUrl(env, path) + '?ref=' + branch, { headers: ghHeaders(env) });
    if (r.status === 404) return json({ ok: true, data: '{}', sha: null, empty: true });
    if (!r.ok) return json({ ok: false, status: r.status, errmsg: 'github get failed' }, r.status);
    const f = await r.json();
    const content = (f.content || '').replace(/\s/g, '');
    let data = '{}';
    try { data = atob(content); } catch (e) { data = '{}'; }
    return json({ ok: true, data: data, sha: f.sha });
  }
  if (request.method === 'PUT') {
    const body = await request.json().catch(function () { return {}; });
    const b64 = btoa(unescape(encodeURIComponent(body.data || '{}')));
    const ghBody = { message: 'update ' + path, content: b64 };
    if (body.sha) ghBody.sha = body.sha;
    const r = await fetch(ghContentsUrl(env, path), {
      method: 'PUT',
      headers: ghHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(ghBody),
    });
    if (!r.ok) return json({ ok: false, status: r.status, errmsg: 'github put failed' }, r.status);
    const j = await r.json();
    return json({ ok: true, sha: j && j.content && j.content.sha });
  }
  return json({ ok: false, errmsg: 'method not allowed' }, 405);
}

async function handleImage(request, env) {
  const branch = env.GITHUB_BRANCH || 'main';
  if (request.method === 'PUT') {
    const body = await request.json().catch(function () { return {}; });
    const ghBody = {
      message: 'add image ' + body.path,
      content: body.content || '',
      branch: branch,
    };
    const r = await fetch(ghContentsUrl(env, body.path), {
      method: 'PUT',
      headers: ghHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(ghBody),
    });
    if (!r.ok) return json({ ok: false, status: r.status, errmsg: 'github put image failed' }, r.status);
    const j = await r.json();
    return json({ ok: true, sha: j && j.content && j.content.sha });
  }
  if (request.method === 'DELETE') {
    const body = await request.json().catch(function () { return {}; });
    const getR = await fetch(ghContentsUrl(env, body.path) + '?ref=' + branch, { headers: ghHeaders(env) });
    if (!getR.ok) return json({ ok: false, status: getR.status, errmsg: 'get before delete failed' }, getR.status);
    const f = await getR.json();
    const r = await fetch(ghContentsUrl(env, body.path), {
      method: 'DELETE',
      headers: ghHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'del image ' + body.path, sha: f.sha, branch: branch }),
    });
    if (!r.ok) return json({ ok: false, status: r.status, errmsg: 'github delete image failed' }, r.status);
    return json({ ok: true });
  }
  return json({ ok: false, errmsg: 'method not allowed' }, 405);
}

async function handleWeread(request, env) {
  const TARGET = 'https://i.weread.qq.com/api/agent/gateway';
  const body = await request.text().catch(function () { return ''; });
  const upstream = await fetch(TARGET, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + (env.WEREAD_KEY || ''), 'Content-Type': 'application/json' },
    body: body,
  });
  const respBody = await upstream.text();
  return new Response(respBody, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = makeCors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const p = url.pathname;

    if (!checkGate(request, env)) {
      return new Response(JSON.stringify({ ok: false, errmsg: 'app key invalid' }), {
        status: 401, headers: Object.assign({}, cors, { 'Content-Type': 'application/json' }),
      });
    }

    try {
      if (p === '/api/data') return withCors(await handleData(request, env), cors);
      if (p === '/api/image') return withCors(await handleImage(request, env), cors);
      if (p === '/api/weread') return withCors(await handleWeread(request, env), cors);
      if (p === '/debug') return withCors(await handleDebug(request, env), cors);
      if (p === '/' || p === '/health') {
        const ghOk = await checkGithub(env);
        return withCors(json({ ok: true, github: ghOk, weread: !!env.WEREAD_KEY }), cors);
      }
      return withCors(json({ ok: false, errmsg: 'not found' }, 404), cors);
    } catch (e) {
      return withCors(json({ ok: false, errmsg: 'worker error: ' + e.message }), 500);
    }
  },
};
