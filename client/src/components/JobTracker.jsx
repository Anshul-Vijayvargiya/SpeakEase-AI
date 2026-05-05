import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const JobTracker = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ company: '', role: '', status: 'Applied', notes: '' });
    const { token } = useSelector(state => state.user);

    useEffect(() => {
        fetchJobs();
    }, [token]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/jobs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(res.data);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddJob = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5001/api/jobs', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs([res.data, ...jobs]);
            setShowAddForm(false);
            setFormData({ company: '', role: '', status: 'Applied', notes: '' });
        } catch (error) {
            console.error('Failed to add job', error);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const jobToUpdate = jobs.find(j => j._id === id);
        try {
            const res = await axios.put(`http://localhost:5001/api/jobs/${id}`, { ...jobToUpdate, status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(jobs.map(j => (j._id === id ? res.data : j)));
        } catch (error) {
            console.error('Failed to update job', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job application?')) return;
        try {
            await axios.delete(`http://localhost:5001/api/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(jobs.filter(j => j._id !== id));
        } catch (error) {
            console.error('Failed to delete job', error);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Applied': return 'bg-blue-100 text-blue-800';
            case 'Interviewing': return 'bg-yellow-100 text-yellow-800';
            case 'Offered': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Job Applications Tracker</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Keep track of your interview pipeline.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-md shadow-blue-200"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    {showAddForm ? 'Cancel' : 'Add Job'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddJob} className="mb-6 p-4 bg-slate-50 border rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Company</label>
                            <input
                                type="text"
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition"
                                placeholder="e.g. Google"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Role</label>
                            <input
                                type="text"
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition"
                                placeholder="e.g. Frontend Engineer"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition cursor-pointer"
                            >
                                <option value="Applied">Applied</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Offered">Offered</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="w-2/3">
                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Notes (Optional)</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition"
                                placeholder="e.g. Referral from John"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition text-sm">Save Application</button>
                    </div>
                </form>
            )}

            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full animate-pulse text-slate-400 font-medium text-sm">Loading applications...</div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full pt-4">
                        <div className="w-12 h-12 bg-slate-50 border rounded-full flex items-center justify-center mb-3 text-slate-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <p className="font-bold text-slate-700 text-sm">No Applications Yet</p>
                        <p className="text-xs text-slate-500 font-medium text-center w-2/3 mt-1">Track the jobs you have applied to.</p>
                    </div>
                ) : (
                    jobs.map(job => (
                        <div key={job._id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-slate-300 transition group bg-slate-50/50">
                            <div>
                                <h4 className="font-bold text-slate-800">{job.company}</h4>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">{job.role}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={job.status}
                                    onChange={(e) => handleUpdateStatus(job._id, e.target.value)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer outline-none appearance-none ${getStatusColor(job.status)}`}
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Interviewing">Interviewing</option>
                                    <option value="Offered">Offered</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <button onClick={() => handleDelete(job._id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default JobTracker;
