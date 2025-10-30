// src/metrics.js
import StatsD from 'hot-shots';

// When running unit tests, don't open sockets or send UDP traffic
const isTest = process.env.NODE_ENV === 'test';

function noop() {}
const noopClient = {
  increment: noop,
  timing: noop,
  gauge: noop,
  histogram: noop,
  event: noop,
  close: noop,
};

export const statsd = isTest
  ? noopClient
  : new StatsD({
      host: '127.0.0.1',
      port: 8125,
      // Ensure CI/unit tests don't hang on process exit
      teardown: true,
      errorHandler: () => {},
    });

// tiny helpers if you want them (optional)
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
