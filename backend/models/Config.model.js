import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    id: { type: String, default: 'main' },
    data: { type: mongoose.Schema.Types.Mixed }
});

export const ConfigModel = mongoose.model('Config', configSchema);
