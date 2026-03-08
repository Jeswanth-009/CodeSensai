const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { buildFollowupPrompt } = require('./shared/promptBuilder');

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

async function callBedrock(systemPrompt, messages) {
  const payload = {
    system: [{ text: systemPrompt }],
    messages,
    inferenceConfig: { maxTokens: 1500 }
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
    const { code, userAnswer, socraticQuestion, mode, conversationHistory } = JSON.parse(event.body || "{}");

    if (!code || !userAnswer || !socraticQuestion) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "code, userAnswer, and socraticQuestion are required" })
      };
    }

    const { systemPrompt, userPrompt } = buildFollowupPrompt(
      code, userAnswer, socraticQuestion, mode, conversationHistory
    );

    // Build proper multi-turn messages for Nova Lite
    const messages = [];

    // First turn: the original code context + socratic question
    messages.push({
      role: "user",
      content: [{ text: `Here is the code I'm learning about:\n\`\`\`\n${code}\n\`\`\`\n\nThe question asked was: ${socraticQuestion}` }]
    });

    // Add conversation history as alternating user/assistant turns
    if (conversationHistory && conversationHistory.length > 0) {
      // Ensure proper alternation — Nova Lite requires user/assistant/user/assistant
      let lastRole = 'user'; // we already added a user message above
      for (const msg of conversationHistory.slice(-6)) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        if (role === lastRole) {
          // Same role twice — merge into previous or add a filler
          if (role === 'user') {
            messages.push({ role: 'assistant', content: [{ text: 'I see, let me think about that.' }] });
          } else {
            messages.push({ role: 'user', content: [{ text: 'Continue.' }] });
          }
        }
        messages.push({ role, content: [{ text: msg.content }] });
        lastRole = role;
      }
      // If last message was assistant, add the new user answer
      if (lastRole === 'assistant') {
        messages.push({ role: 'user', content: [{ text: userAnswer }] });
      } else {
        // Last was user — add filler assistant then user answer
        messages.push({ role: 'assistant', content: [{ text: 'Let me evaluate your previous response.' }] });
        messages.push({ role: 'user', content: [{ text: userAnswer }] });
      }
    } else {
      // No history — just add an assistant acknowledgment then the user answer
      messages.push({ role: 'assistant', content: [{ text: `Great question to think about! Let me hear your thoughts on: ${socraticQuestion}` }] });
      messages.push({ role: 'user', content: [{ text: userAnswer }] });
    }

    const rawResponse = await callBedrock(systemPrompt, messages);
    const cleanResponse = rawResponse
      .replace(/```json\n?|\n?```/g, '')
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : '')
      .trim();
    let result;
    try {
      result = JSON.parse(cleanResponse);
    } catch (parseErr) {
      // Try to extract JSON object from the response text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*"isCorrect"[\s\S]*"feedback"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          result = { isCorrect: false, feedback: cleanResponse, deeperInsight: "", nextQuestion: null };
        }
      } else {
        result = { isCorrect: false, feedback: cleanResponse, deeperInsight: "", nextQuestion: null };
      }
    }

    // Normalize all fields to strings
    if (result.feedback && typeof result.feedback !== 'string') result.feedback = JSON.stringify(result.feedback);
    if (result.deeperInsight && typeof result.deeperInsight !== 'string') result.deeperInsight = JSON.stringify(result.deeperInsight);
    if (result.nextQuestion && typeof result.nextQuestion !== 'string') result.nextQuestion = JSON.stringify(result.nextQuestion);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("Followup error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
