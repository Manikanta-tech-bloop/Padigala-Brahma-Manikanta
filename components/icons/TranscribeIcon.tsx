import React from 'react';

const TranscribeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25l2.25 2.25 2.25-2.25M3 12l2.25 2.25 2.25-2.25M3 15.75l2.25 2.25 2.25-2.25M9.75 8.25h11.25m-11.25 3.75h11.25m-11.25 3.75h11.25" />
    </svg>
);

export default TranscribeIcon;