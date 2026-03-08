exports.handler = async () => ({
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    status: "ok",
    service: "CodeSensei API",
    model: "amazon.nova-lite-v1:0",
    region: process.env.AWS_REGION || "ap-south-2",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  })
});
