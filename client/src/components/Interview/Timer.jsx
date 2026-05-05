import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Timer = ({ duration, onComplete, isActive }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        // Reset timer when it becomes active again (next question)
        if (isActive) {
            setTimeLeft(duration);
        }
    }, [isActive, duration]);

    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            if (onComplete) onComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const percentage = (timeLeft / duration) * 100;

    // Color change warning
    const pathColor = timeLeft <= 10 ? '#ef4444' : '#2563eb'; // Red if <= 10s, else Blue

    return (
        <div className="w-24 h-24 font-black drop-shadow-sm">
            <CircularProgressbar
                value={percentage}
                text={`${timeLeft}s`}
                styles={buildStyles({
                    pathColor: pathColor,
                    textColor: '#1e293b',
                    trailColor: '#f1f5f9',
                    pathTransitionDuration: 0.5,
                })}
            />
        </div>
    );
};

export default Timer;
