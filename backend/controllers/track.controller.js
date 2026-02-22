import { TrackModel } from '../models/Track.model.js';

export const TrackController = {
    async logEvent(req, res) {
        try {
            const { event, combo_id, url, timestamp, device, meta } = req.body;
            await TrackModel.create({
                event: event || 'unknown',
                combo_id: combo_id || null,
                url: url || '',
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                device: device || 'unknown',
                meta: meta || {}
            });
            res.json({ ok: true });
        } catch (e) {
            console.error('[Track] Error:', e.message);
            res.status(500).json({ ok: false });
        }
    },

    async getStats(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const since = new Date();
            since.setDate(since.getDate() - days);

            const [totals, daily] = await Promise.all([
                TrackModel.aggregate([
                    { $match: { timestamp: { $gte: since } } },
                    { $group: { _id: '$event', count: { $sum: 1 } } }
                ]),
                TrackModel.aggregate([
                    { $match: { timestamp: { $gte: since } } },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                                event: '$event'
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.date': 1 } }
                ])
            ]);

            const summary = {};
            totals.forEach(t => { summary[t._id] = t.count; });

            const dailyMap = {};
            daily.forEach(d => {
                if (!dailyMap[d._id.date]) dailyMap[d._id.date] = {};
                dailyMap[d._id.date][d._id.event] = d.count;
            });

            res.json({
                period: `${days}d`,
                summary,
                daily: Object.entries(dailyMap).map(([date, events]) => ({ date, ...events }))
            });
        } catch (e) {
            console.error('[Track Stats] Error:', e.message);
            res.status(500).json({ error: 'Error aggregating stats' });
        }
    }
};
