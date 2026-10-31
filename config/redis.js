const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => console.log("redis connection failed", err));
client.on("connect", () => console.log("redis connection successful"));

client.connect();

module.exports = client;
