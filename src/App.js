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
    </div>
  );

}