const { DynamoDBClient, QueryCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-2" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  const userId = event.queryStringParameters?.userId || "anonymous";

  if (event.httpMethod === "GET") {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: process.env.HISTORY_TABLE || "codesensei-history",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": { S: userId } },
        ScanIndexForward: false,
        Limit: 100
      }));

      const items = result.Items?.map(item => ({
        timestamp: item.timestamp.S,
        code: item.code.S,
        language: item.language.S,
        explanation: JSON.parse(item.explanation.S)
      })) || [];

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ items })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: process.env.HISTORY_TABLE || "codesensei-history",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": { S: userId } }
      }));

      const deletePromises = result.Items?.map(item =>
        dynamoClient.send(new DeleteItemCommand({
          TableName: process.env.HISTORY_TABLE || "codesensei-history",
          Key: {
            userId: { S: item.userId.S },
            timestamp: { S: item.timestamp.S }
          }
        }))
      ) || [];

      await Promise.all(deletePromises);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: "History cleared" })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
};
