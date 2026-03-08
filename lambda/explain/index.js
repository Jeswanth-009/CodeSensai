const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { buildExplainPrompt } = require('./shared/promptBuilder');

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-2" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

async function callBedrock(systemPrompt, userPrompt) {
  const payload = {
    system: [{ text: systemPrompt }],
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens: 2000 }
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.output.message.content[0].text;
}

async function saveToHistory(userId, code, language, explanation) {
  try {
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.HISTORY_TABLE || "codesensei-history",
      Item: {
        userId: { S: userId || "anonymous" },
        timestamp: { S: new Date().toISOString() },
        code: { S: code.substring(0, 500) },
        language: { S: language || "unknown" },
        explanation: { S: JSON.stringify(explanation) },
        expiresAt: { N: String(Math.floor(Date.now() / 1000) + 2592000) }
      }
    }));
  } catch (err) {
    console.error("DynamoDB save error:", err);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { code, language, errorMessage, mode, conversationHistory, userId } = body;

    if (!code) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "code is required" })
      };
    }

    // Truncate code to save tokens/cost
    const truncatedCode = code.length > 4000 ? code.substring(0, 4000) + '\n// ... (truncated)' : code;

    const { systemPrompt, userPrompt } = buildExplainPrompt(
      truncatedCode, language, errorMessage, mode, conversationHistory
    );

    const rawResponse = await callBedrock(systemPrompt, userPrompt);
    const cleanResponse = rawResponse
      .replace(/```json\n?|\n?```/g, '')
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : '')
      .trim();
    
    let explanation;
    try {
      explanation = JSON.parse(cleanResponse);
    } catch (parseErr) {
      // If JSON parsing fails, return raw text in a structured format
      explanation = {
        level1: cleanResponse,
        level2: "",
        pitfalls: "",
        socraticQuestion: "",
        errorExplanation: null
      };
    }

    // Normalize all fields to strings (Nova Lite sometimes returns arrays/objects)
    for (const key of ['level1', 'level2', 'pitfalls', 'socraticQuestion', 'errorExplanation']) {
      const val = explanation[key];
      if (val === null || val === undefined) continue;
      if (typeof val !== 'string') {
        if (Array.isArray(val)) {
          explanation[key] = val.map(item => {
            if (typeof item === 'string') return item;
            return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('\n');
          }).join('\n\n');
        } else if (typeof val === 'object') {
          explanation[key] = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join('\n');
        } else {
          explanation[key] = String(val);
        }
      }
    }

    await saveToHistory(userId, code, language, explanation);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(explanation)
    };
  } catch (err) {
    console.error("Explain error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};
