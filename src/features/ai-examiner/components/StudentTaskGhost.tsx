import React from 'react';

const StudentTaskGhost = () => {
  return (
    <>
      
      <div
        className="student-task-ghost bg-white p-6 rounded-md shadow-lg max-w-3xl mx-auto relative mt-6"
        style={{ maxHeight: '400px', overflow: 'hidden' }}
      >
        <h2 className="mb-4 text-center text-2xl">Genererer din eksamen</h2>
        <div className="ghost-line ghost-line-title mb-4"></div>
        <div className="ghost-line w-3/4 mb-3"></div>
        <div className="ghost-line w-5/6 mb-3"></div>
        <div className="ghost-line w-4/5 mb-3"></div>
        <div className="ghost-line w-2/3 mb-3"></div>
        <div className="ghost-line w-5/6 mb-3"></div>
        <div className="ghost-line w-5/6 mb-3"></div>
        <div className="ghost-line w-4/5 mb-3"></div>
        <div className="ghost-line w-4/5 mb-3"></div>
        <div className="ghost-line w-3/4 mb-3"></div>
        <div className="ghost-line w-2/3 mb-3"></div>
      </div>
      <style>
        {`
          @keyframes ghostPulse {
            0% { opacity: 0.5; }
            50% { opacity: 0.7; }
            100% { opacity: 0.5; }
          }
          .ghost-line {
            height: 16px;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin-bottom: 12px;
            animation: ghostPulse 1.5s infinite ease-in-out;
          }
          .ghost-line-title {
            height: 24px;
            width: 60%;
          }
        `}
      </style>
    </>
  );
};

export default StudentTaskGhost;
