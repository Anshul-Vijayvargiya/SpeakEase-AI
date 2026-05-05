import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ReportViewer = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/generate/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!report) return <div className="not-found">Report not found</div>;

  return (
    <div className="report-container">
      <h1>Interview Report</h1>
      
      <div className="report-header">
        <h2>{report.role} - {report.interviewType}</h2>
        <p>Date: {new Date(report.date).toLocaleDateString()}</p>
        <p>Candidate: {report.candidateName}</p>
      </div>

      <div className="overall-score">
        <h3>Overall Score: {Math.round(report.overallScore)}%</h3>
      </div>

      <div className="rounds-summary">
        {Object.entries(report.rounds).map(([roundName, roundData]) => (
          roundData.questions.length > 0 && (
            <div key={roundName} className="round-card">
              <h4>{roundName.toUpperCase()} Round - Score: {Math.round(roundData.score)}%</h4>
              {roundData.questions.map((q, idx) => (
                <div key={idx} className="question-item">
                  <p><strong>Q{idx + 1}:</strong> {q.question}</p>
                  <p><strong>Your Answer:</strong> {q.answer}</p>
                  <p><strong>Score:</strong> {q.score}%</p>
                  <p><strong>Feedback:</strong> {q.feedback}</p>
                </div>
              ))}
            </div>
          )
        ))}
      </div>

      <div className="metrics-section">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric">Technical Accuracy: {report.metrics.technicalAccuracy}%</div>
          <div className="metric">Problem Solving: {report.metrics.problemSolving}%</div>
          <div className="metric">Communication: {report.metrics.communication}%</div>
          <div className="metric">Confidence: {report.metrics.confidence}%</div>
        </div>
      </div>

      <div className="feedback-section">
        <h3>Summary</h3>
        <p><strong>Strengths:</strong> {report.summary.strengths.join(', ') || 'None identified'}</p>
        <p><strong>Areas to Improve:</strong> {report.summary.improvements.join(', ') || 'None identified'}</p>
        <p><strong>Final Feedback:</strong> {report.summary.finalFeedback}</p>
      </div>

      <button onClick={() => window.print()} className="print-btn">
        Print Report
      </button>
    </div>
  );
};

export default ReportViewer;