const JobApplication = require('../models/JobApplication');

exports.getJobs = async (req, res) => {
    try {
        const jobs = await JobApplication.find({ userId: req.user._id }).sort({ appliedDate: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

exports.addJob = async (req, res) => {
    try {
        const { company, role, status, appliedDate, notes } = req.body;
        const job = new JobApplication({
            userId: req.user._id,
            company,
            role,
            status,
            appliedDate,
            notes
        });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add job' });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { company, role, status, appliedDate, notes } = req.body;
        const job = await JobApplication.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { company, role, status, appliedDate, notes },
            { new: true }
        );
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update job' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const job = await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
