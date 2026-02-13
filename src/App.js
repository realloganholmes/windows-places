import { useState } from "react";
import All from "./All";
import GeoGuess from "./GeoGuess";
import "./App.css";

export default function App() {
  const [quizMode, setQuizMode] = useState(false);

  return (
    <div>
      <div className="quiz-toggle">
        <span className="quiz-toggle-label">Quiz Mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={quizMode}
            onChange={(e) => setQuizMode(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>

      {quizMode ? <GeoGuess /> : <All />}

      <a
        className="linkedin-badge"
        href="https://www.linkedin.com/in/realloganholmes"
        target="_blank"
        rel="noreferrer"
        aria-label="LinkedIn profile for Logan Holmes"
      >
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path d="M4.98 3.5C3.33 3.5 2 4.84 2 6.49c0 1.64 1.32 2.98 2.96 2.98h.02c1.66 0 2.99-1.34 2.99-2.98C7.97 4.84 6.64 3.5 4.98 3.5zM2.4 21h5.16V9H2.4v12zM9.6 9v12h5.16v-6.7c0-3.72 4.8-4.02 4.8 0V21H24v-7.5c0-6.08-6.72-5.86-9.24-2.86V9H9.6z" />
        </svg>
        <span>Logan Holmes</span>
      </a>
    </div>
  );

}