const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Monitor = require('../models/Monitor');
const Ping = require('../models/Ping');

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// POST /api/monitors — create a new monitor
router.post('/', async (req, res) => {
  try {
    const { url, name } = req.body;
    const userId = req.auth.userId;

    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name are required' });
    }

    const newMonitor = new Monitor({ userId, url, name });
    await newMonitor.save();

    res.status(201).json(newMonitor);
  } catch (error) {
    console.error('Error creating monitor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/monitors — get all monitors belonging to the logged in user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const monitors = await Monitor.find({ userId }).lean();

    // For each monitor, calculate stats based on the last 20 pings
    const monitorsWithStats = await Promise.all(
      monitors.map(async (monitor) => {
        const pings = await Ping.find({ monitorId: monitor._id })
          .sort({ checkedAt: -1 }) // Get most recent first
          .limit(20)
          .lean();

        let uptimePercentage = 0;
        let latestStatus = 'unknown';
        let latestResponseTime = null;

        if (pings.length > 0) {
          const upCount = pings.filter((p) => p.status === 'up').length;
          uptimePercentage = Math.round((upCount / pings.length) * 100);
          
          latestStatus = pings[0].status; // The first one is the most recent
          latestResponseTime = pings[0].responseTime;
        }

        return {
          ...monitor,
          uptimePercentage,
          latestStatus,
          latestResponseTime,
        };
      })
    );

    res.json(monitorsWithStats);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/monitors/:id — delete a monitor
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Ensure we only delete if it belongs to the authenticated user
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found or unauthorized' });
    }

    // Also cascade delete all pings associated with this monitor
    await Ping.deleteMany({ monitorId: monitor._id });

    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/monitors/:id/pings — get the last 20 pings for a specific monitor
router.get('/:id/pings', async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // First confirm the monitor exists and belongs to the user
    const monitor = await Monitor.findOne({ _id: req.params.id, userId });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found or unauthorized' });
    }

    const pings = await Ping.find({ monitorId: monitor._id })
      .sort({ checkedAt: -1 })
      .limit(20)
      .lean();

    // Return them in chronological order if preferred, or latest first as it is now.
    res.json(pings);
  } catch (error) {
    console.error('Error fetching pings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
