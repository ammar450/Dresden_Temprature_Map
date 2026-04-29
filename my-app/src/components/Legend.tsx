import React from 'react';
import { TEMP_MIN, TEMP_MAX, tempToHex } from '../utils/colorScale';

export const Legend: React.FC = () => {
  const stops = Array.from({ length: 21 }, (_, i) => {
    const temp = TEMP_MIN + (i / 20) * (TEMP_MAX - TEMP_MIN);
    return tempToHex(temp);
  });

  const gradient = `linear-gradient(to right, ${stops.join(', ')})`;

  return (
    <div className="legend">
      <div className="legend__title">Air Temperature</div>
      <div className="legend__gradient" style={{ background: gradient }} />
      <div className="legend__labels">
        <span>{TEMP_MIN} °C</span>
        <span>{Math.round((TEMP_MIN + TEMP_MAX) / 2)} °C</span>
        <span>{TEMP_MAX} °C</span>
      </div>
    </div>
  );
};
