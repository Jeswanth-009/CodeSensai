const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { buildComplexityPrompt } = require('./shared/promptBuilder');

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

async function callBedrock(systemPrompt, userPrompt) {
  const payload = {
    system: [{ text: systemPrompt }],
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens: 1000 }
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  return JSON.parse(Buffer.from(response.body).toString()).output.message.content[0].text;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const { code, language, mode } = JSON.parse(event.body || "{}");

    if (!code) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "code is required" })
      };
    }

    const truncatedCode = code.length > 4000 ? code.substring(0, 4000) + '\n// ... (truncated)' : code;

    const { systemPrompt, userPrompt } = buildComplexityPrompt(truncatedCode, language, mode);
    const rawResponse = await callBedrock(systemPrompt, userPrompt);
    const cleanResponse = rawResponse
      .replace(/```json\n?|\n?```/g, '')
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : '')
      .trim();
    let result;
    try {
      result = JSON.parse(cleanResponse);
    } catch (parseErr) {
      result = { timeComplexity: "Unknown", spaceComplexity: "Unknown", badge: "yellow", explanation: cleanResponse, optimization: null };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("Complexity error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
