import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['available', 'rented', 'maintenance'],
        default: 'available'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    monthlyRate: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Unit', unitSchema);
