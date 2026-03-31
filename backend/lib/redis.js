import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_URL;

export const redis = redisUrl
	? new Redis(redisUrl, {
		  lazyConnect: true,
		  enableOfflineQueue: false,
		  maxRetriesPerRequest: 1,
		  retryStrategy(times) {
			  if (times > 2) return null;
			  return Math.min(times * 200, 1000);
		  },
	  })
	: null;

if (redis) {
	redis.on("error", (error) => {
		console.warn("Redis unavailable, continuing without cache:", error.message);
	});
}