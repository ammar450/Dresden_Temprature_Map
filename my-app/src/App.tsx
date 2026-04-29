import React, { useState, useEffect, useCallback } from 'react';
import { MapView } from './components/MapView';
import { TimeSlider } from './components/TimeSlider';
import { Legend } from './components/Legend';
import { useTemperatureData } from './hooks/useTemperatureData';
import './App.css';

function App() {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [bbox, setBbox] = useState<string>('');

  const { times, networks, features, loading, error } = useTemperatureData(
    selectedTime,
    selectedNetwork,
    bbox,
  );

  useEffect(() => {
    if (times.length > 0 && selectedTime === '') {
      setSelectedTime(times[0]);
    }
  }, [times, selectedTime]);

  const handleBboxChange = useCallback((newBbox: string | null) => {
    setBbox(newBbox ?? '');
  }, []);

  if (error) {
    return (
      <div className="app-error">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">Dresden Air Temperature Map</h1>
        <div className="app-header__controls">
          <p className="app-header__subtitle">
            {loading ? 'Loading…' : `${features.length} sensor${features.length !== 1 ? 's' : ''} active`}
          </p>
          {bbox && <span className="bbox-badge">Area filter active</span>}
          <select
            className="network-filter"
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            aria-label="Filter by network"
          >
            <option value="">All networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-main">
        <div className="map-wrapper">
          {selectedTime && (
            <MapView
              features={features}
              onBboxChange={handleBboxChange}
              activeBbox={bbox || null}
            />
          )}
          <Legend />
        </div>

        {selectedTime && (
          <TimeSlider
            times={times}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
          />
        )}
      </main>
    </div>
  );
}

export default App;
