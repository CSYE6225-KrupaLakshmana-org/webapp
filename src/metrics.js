// src/metrics.js
import StatsD from 'hot-shots';

export const statsd = new StatsD({
  host: '127.0.0.1',
  port: 8125,
  errorHandler: () => {} // don't crash app if metrics send fails
});

export async function timeAsync(metricName, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    statsd.timing(metricName, Date.now() - start);
    return result;
  } catch (e) {
    statsd.timing(metricName, Date.now() - start);
    throw e;
  }
}

export async function timePromise(metricName, promise) {
  const start = Date.now();
  try {
    const result = await promise;
    statsd.timing(metricName, Date.now() - start);
    return result;
  } catch (e) {
    statsd.timing(metricName, Date.now() - start);
    throw e;
  }
}
