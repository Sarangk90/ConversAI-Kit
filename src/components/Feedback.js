// src/components/Feedback.js
import React from 'react';
import '../styles/Feedback.css';

const Feedback = ({ onFeedback }) => (
    <div className="feedback">
        <button onClick={() => onFeedback('up')}>👍</button>
        <button onClick={() => onFeedback('down')}>👎</button>
    </div>
);

export default Feedback;
