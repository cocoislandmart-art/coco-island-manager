// ── Claude API Helper ────────────────────────────────────────────
// IMPORTANT: Replace YOUR_ANTHROPIC_API_KEY with your actual key
// or set ANTHROPIC_API_KEY in your .env file

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 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
export async function callClaude({ system, userContent, maxTokens = 1000 }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// ── System Prompts ───────────────────────────────────────────────

export const EMAIL_SYSTEM = `你是一个专业的电商客服助手，代表 Coco Island Mart 回复客户邮件。
识别问题类型并给出专业、友好的回复。

1. 订单状态/物流查询 - 告知1个工作日内核实，引导"我的订单"页面
2. 退换货申请 - 确认收到，说明需提供订单号+照片，3个工作日处理
3. 商品咨询 - 友好回答，无法确认则告知跟进
4. 投诉/差评 - 真诚道歉，高度重视，承诺跟进

在回复最前面用【】标注类型：订单状态/物流、退换货申请、商品咨询、投诉/差评、其他
语言与客户一致，简洁不超200字，署名"客服团队 Customer Service"`;

export const PRODUCT_SYSTEM = `你是专业的电商产品文案师。根据产品信息或图片生成吸引人的文案。
格式：
【产品标题】15字内
【产品卖点】3个核心卖点
【产品描述】100-150字，中英双语，用---分隔
【SEO标签】5个关键词
语气：专业、吸引人、突出价值`;

export const MARKETING_SYSTEM = `你是电商营销文案专家，为 Coco Island Mart 生成本地配送推广文案。
要求：突出当日/次日达优势，语气亲切，中英双语。
格式：先写中文版，再写English version，用---分隔。`;
