import axios from 'axios';
import { logError, logInfo, logDebug, logSummary } from './logging.js'; // Importing logging
import { APIError, handleError } from './errorHandling.js';

export default async function checkQuota(API_KEY) {
  const url = `https://www.googleapis.com/youtube/v3/yourEndpoint?key=${API_KEY}`;
  console.log(url);
  try {
    const response = await axios.get(url);

    // Extract quota-related headers
    const remainingQuota = response.headers['x-ratelimit-remaining'];
    const totalQuota = response.headers['x-ratelimit-limit'];
    const quotaResetTime = response.headers['x-ratelimit-reset'];
    logInfo('Quota Response: ', response.data);
    logSummary(`Remaining Quota: ${remainingQuota}`);
    logSummary(`Total Quota: ${totalQuota}`);
    logSummary(
      `Quota Reset Time: ${new Date(quotaResetTime * 1000).toLocaleString()}`,
    );
  } catch (error) {
    try {
      handleError(error, 'Error during quota checking');
    } catch (error) {
      return null;
    }
  }
}
