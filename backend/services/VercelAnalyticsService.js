import axios from 'axios';
import logger from '../config/logger.js';
// Trigger nodemon reload with new environment variables

/**
 * Fetch Web Analytics data from Vercel REST API
 */
const fetchVercelAnalytics = async () => {
    const token = process.env.VERCEL_ACCESS_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID; // optional

    if (!token || !projectId) {
        throw new Error("Vercel Analytics credentials (VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID) are not configured in the backend .env");
    }

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const since = sevenDaysAgo.toISOString();
    const until = now.toISOString();

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const params = {
        projectId,
        since,
        until,
        ...(teamId && { teamId })
    };

    try {
        const [byDay, byPath, byCountry, byDevice, byReferrer] = await Promise.all([
            axios.get('https://api.vercel.com/v1/query/web-analytics/visits/aggregate', {
                headers,
                params: { ...params, by: 'day' }
            }),
            axios.get('https://api.vercel.com/v1/query/web-analytics/visits/aggregate', {
                headers,
                params: { ...params, by: 'requestPath', limit: 10 }
            }),
            axios.get('https://api.vercel.com/v1/query/web-analytics/visits/aggregate', {
                headers,
                params: { ...params, by: 'country', limit: 10 }
            }),
            axios.get('https://api.vercel.com/v1/query/web-analytics/visits/aggregate', {
                headers,
                params: { ...params, by: 'deviceType', limit: 10 }
            }),
            axios.get('https://api.vercel.com/v1/query/web-analytics/visits/aggregate', {
                headers,
                params: { ...params, by: 'referrerHostname', limit: 10 }
            })
        ]);

        return {
            byDay: byDay.data?.data || byDay.data?.result || [],
            byPath: byPath.data?.data || byPath.data?.result || [],
            byCountry: byCountry.data?.data || byCountry.data?.result || [],
            byDevice: byDevice.data?.data || byDevice.data?.result || [],
            byReferrer: byReferrer.data?.data || byReferrer.data?.result || []
        };
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        logger.error(`[VercelAnalytics] API request failed: ${errorMsg}`);
        throw new Error(errorMsg);
    }
};

export { fetchVercelAnalytics };
