// rateLimit.ts
type RateLimitKey = string;

interface RateLimitResult {
  success: boolean;
  reset: number;
}

const requestsMap: Map<RateLimitKey, { count: number; lastRequest: number }> =
  new Map();
const REQUEST_LIMIT = 5; // Number of requests allowed within the timeframe
const TIME_FRAME = 60 * 1000; // Timeframe in milliseconds (1 minute)

export async function checkRateLimit(
  key: RateLimitKey,
  endpoint: string,
): Promise<RateLimitResult> {
  const currentTime = Date.now();
  const rateLimitData = requestsMap.get(key);

  if (!rateLimitData) {
    // If no data, initialize for this key
    requestsMap.set(key, { count: 1, lastRequest: currentTime });
    return {
      success: true,
      reset: TIME_FRAME,
    };
  }

  const timePassed = currentTime - rateLimitData.lastRequest;

  if (timePassed > TIME_FRAME) {
    // If the time passed since the last request is more than the timeframe, reset the count
    requestsMap.set(key, { count: 1, lastRequest: currentTime });
    return {
      success: true,
      reset: TIME_FRAME,
    };
  }

  if (rateLimitData.count >= REQUEST_LIMIT) {
    // If the request count exceeds the limit, return an error
    return {
      success: false,
      reset: TIME_FRAME - timePassed,
    };
  }

  // Increment request count
  rateLimitData.count += 1;
  rateLimitData.lastRequest = currentTime;
  requestsMap.set(key, rateLimitData);

  return {
    success: true,
    reset: TIME_FRAME - timePassed,
  };
}
