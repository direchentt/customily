import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
    event: String,       // 'view' | 'added_combo' | 'offer_click' | 'offer_add'
    combo_id: String,
    url: String,
    timestamp: { type: Date, default: Date.now },
    device: String,      // 'mobile' | 'desktop'
    meta: mongoose.Schema.Types.Mixed
});

trackSchema.index({ timestamp: -1 });
trackSchema.index({ event: 1, timestamp: -1 });

export const TrackModel = mongoose.model('Track', trackSchema);
