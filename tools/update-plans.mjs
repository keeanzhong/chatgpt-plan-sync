// tools/update-plans.mjs
// 从 https://chatgpt.com/pricing 抓取套餐对比信息，生成 plans-override.json

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "plans-override.json");

const PLAN_KEY_MAP = {
  Free: "free",
  Plus: "plus",
  Pro: "pro",
  Team: "business",
  Business: "business",
  Enterprise: "enterprise"
};

const FEATURE_KEY_MAP = {
  "GPT-5.1": "p_51_inst",
  "GPT-5.1 thinking": "p_51_think",
  "GPT-5.1 pro": "p_51_pro",
  "GPT-5 thinking mini": "p_5_think_mini",
  "OpenAI o3": "o3",
  "OpenAI o3 pro": "o3_pro",
  "OpenAI o4-mini": "o4_mini",
  "GPT-4.1": "legacy_41",
  "GPT-4o": "legacy_4o",

  "Deep research": "deep_res",
  "ChatGPT agent": "agent",
  "File uploads": "upload",
  "Vision": "vision",
  "Image generation": "img_gen",
  "Memory": "memory",
  "Connectors to internal sources": "cloud",
  "Sora 1": "sora",
  "Codex agent": "codex",

  "Content is used to train our models": "privacy"
};

function mapValueToChinese(featureName, rawValue) {
  const v = rawValue.trim();

  if (featureName === "Content is used to train our models") {
    if (/^No\b/i.test(v)) return "🔒 不训练数据";
    return "⚠️ 默认参与训练 (可关闭)";
  }

  if (/^No\b/i.test(v)) return "❌ 不提供";
  if (/^Yes\b/i.test(v)) return "✅ 提供";
  if (/^Limited\b/i.test(v)) return "✅ 有限制 (Limited)";
  if (/^Expanded\b/i.test(v)) return "✅ 扩展 (Expanded)";
  if (/^Unlimited/i.test(v)) return "✅ 无限制* (Unlimited*)";
  if (/^Standard\b/i.test(v)) return "✅ 标准 (Standard)";
  if (/^Flexible/i.test(v)) return "✅ 灵活** (Flexible**)";

  return v;
}

async function main() {
  console.log("▶ 请求 https://chatgpt.com/pricing ...");
  const res = await fetch("https://chatgpt.com/pricing", {
    headers: { "User-Agent": "chatgpt-plan-sync/1.0" }
  });

  if (!res.ok) {
    console.error("❌ upstream 失败，status =", res.status);
    process.exit(1);
  }

  const html = await res.text();
  console.log("✅ 已获取 HTML，长度:", html.length);

  // 利用无障碍文本："Plan: Free, Feature: GPT-5.1, Expanded"
  const regex =
    /Plan:\s*(Free|Plus|Pro|Team|Business|Enterprise),\s*Feature:\s*([^,]+),\s*([^\n<]+)/g;

  const patches = {
    free: {},
    go: {},
    plus: {},
    pro: {},
    business: {},
    enterprise: {},
    edu: {},
    teachers: {}
  };

  let match;
  let count = 0;

  while ((match = regex.exec(html)) !== null) {
    const [, planName, featureNameRaw, valueRaw] = match;
    const featureName = featureNameRaw.trim();
    const rawValue = valueRaw.trim();

    const planKey = PLAN_KEY_MAP[planName];
    const fieldKey = FEATURE_KEY_MAP[featureName];

    if (!planKey || !fieldKey) continue;

    const zhText = mapValueToChinese(featureName, rawValue);
    patches[planKey][fieldKey] = zhText;
    count++;
  }

  console.log("✅ 解析完成，匹配条数:", count);

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(patches, null, 2), "utf8");
  console.log("✅ 已写入", OUTPUT_FILE);
}

main().catch((err) => {
  console.error("❌ 脚本异常:", err);
  process.exit(1);
});
