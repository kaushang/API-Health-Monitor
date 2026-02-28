const cron = require('node-cron');
const axios = require('axios');
const Monitor = require('./models/Monitor');
const Ping = require('./models/Ping');

const startScheduler = () => {
  const schedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

  cron.schedule(schedule, async () => {
    console.log(`[Scheduler] Running health checks at ${new Date().toISOString()}`);
    
    try {
      const monitors = await Monitor.find();

      if (monitors.length === 0) {
        console.log('[Scheduler] No monitors found to check.');
        return;
      }

      // Ping all monitors concurrently
      await Promise.all(
        monitors.map(async (monitor) => {
          const startTime = Date.now();
          let status = 'down';
          let responseTime = null;

          try {
            const response = await axios.get(monitor.url, {
              timeout: 10000, // 10 seconds timeout
            });

            // Any 2xx or 3xx response is considered "up"
            if (response.status >= 200 && response.status < 400) {
              status = 'up';
              responseTime = Date.now() - startTime;
            }
          } catch (error) {
            // Failure or timeout
            status = 'down';
            responseTime = null;
          }

          // Save the ping result
          const ping = new Ping({
            monitorId: monitor._id,
            status,
            responseTime,
          });

          await ping.save();
        })
      );

      console.log(`[Scheduler] Completed health checks for ${monitors.length} monitor(s).`);
    } catch (error) {
      console.error('[Scheduler] Error running health checks:', error);
    }
  });

  console.log(`[Scheduler] Started with schedule: ${schedule}`);
};

module.exports = { startScheduler };
