import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TimeSliderProps {
  times: string[];
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  times,
  selectedTime,
  onTimeChange,
}) => {
  const currentIndex = times.indexOf(selectedTime);
  const [playing, setPlaying] = useState(false);
  const indexRef = useRef(currentIndex);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const advance = useCallback(() => {
    const next = indexRef.current + 1;
    if (next >= times.length) {
      setPlaying(false);
      return;
    }
    indexRef.current = next;
    onTimeChange(times[next]);
  }, [times, onTimeChange]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, 800);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, advance]);

  useEffect(() => {
    if (currentIndex === times.length - 1 && playing) {
      setPlaying(false);
    }
  }, [currentIndex, times.length, playing]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    onTimeChange(times[parseInt(e.target.value, 10)]);
  };

  const step = (delta: number) => {
    setPlaying(false);
    const next = currentIndex + delta;
    if (next >= 0 && next < times.length) onTimeChange(times[next]);
  };

  const togglePlay = () => setPlaying((p) => !p);

  return (
    <div className="time-slider">
      <div className="time-slider__display">{formatTime(selectedTime)}</div>

      <div className="time-slider__controls">
        <button
          className="time-slider__btn"
          onClick={() => step(-1)}
          disabled={currentIndex === 0}
          title="Previous time step"
        >
          ‹
        </button>

        <button
          className={`time-slider__btn time-slider__btn--play ${playing ? 'active' : ''}`}
          onClick={togglePlay}
          disabled={currentIndex === times.length - 1}
          title={playing ? 'Pause' : 'Auto-play'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <input
          type="range"
          className="time-slider__range"
          min={0}
          max={times.length - 1}
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleSlider}
        />

        <button
          className="time-slider__btn"
          onClick={() => step(1)}
          disabled={currentIndex === times.length - 1}
          title="Next time step"
        >
          ›
        </button>
      </div>

      <div className="time-slider__info">
        Step {currentIndex + 1} of {times.length}
      </div>
    </div>
  );
};
