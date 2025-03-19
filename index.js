const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
var cors = require('cors')

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors())

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
const db = mongoose.connection;
db.on('error', (error) => console.error('MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));
const LocationSchema = new mongoose.Schema({
    location: { type: String, required: true },
}, { timestamps: true });
const Location = mongoose.model('Location', LocationSchema);
const JobTypeSchema = new mongoose.Schema({
    jobType: { type: String, required: true },
}, { timestamps: true });
const JobType = mongoose.model('JobType', JobTypeSchema);
const JobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    jobTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobType', required: true },
    salaryRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    applicationDeadline: { type: Date, required: true },
    jobDescription: { type: String, required: true },
    saveDraft: { type: Boolean, required: true },
}, { timestamps: true });

const Jobs = mongoose.model('Job', JobSchema);
app.post('/jobs', async (req, res) => {
    try {
        const job = new Jobs(req.body);
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/jobs', async (req, res) => {
    try {
        const { jobTitle, locationId, min, max, jobTypeId } = req.query;
        const filter = {};
        if (jobTitle) filter.jobTitle = new RegExp(jobTitle, 'i');
        if (locationId) filter.locationId = locationId;
        if (min || max) {
            filter["salaryRange.min"] = { $gte: Number(min) || 0 };
            filter["salaryRange.max"] = { $lte: Number(max) || Infinity };
        }
        if (jobTypeId) filter.jobTypeId = jobTypeId;

        const jobs = await Jobs.find(filter).populate('locationId').populate('jobTypeId'); // Populate user reference
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Define port from environment or default
const PORT = process.env.PORT || 10000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
