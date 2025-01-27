import React, { useState, useEffect } from 'react';

const SAMPLE_QUESTIONS = [
  "who was the best Cubs pitcher of all time?",
  "what was the Cubs' worst season?",
  "tell me about the 1908 World Series",
  "who hit the most home runs at Wrigley Field?",
  "what was the longest Cubs game ever?",
  "tell me about the Billy Goat curse",
  "what year did Wrigley Field open?",
  "who was Mr. Cub?",
  "what was the Cubs' longest winning streak?",
  "tell me about the 2016 World Series"
];

export function CyclingQuestions() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out/in every 4 seconds
    const fadeInterval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuestion((prev) => (prev + 1) % SAMPLE_QUESTIONS.length);
        setIsVisible(true);
      }, 500); // Change question after fade out
    }, 4000);

    return () => clearInterval(fadeInterval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-gray-600">Old Timer...</span>
      <span 
        className={`text-gray-500 transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {SAMPLE_QUESTIONS[currentQuestion]}
      </span>
    </div>
  );
} 