const serverless = require("serverless-http");
const { app, connectToDatabase } = require("../../Routes/server");

const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return handler(event, context);
};
