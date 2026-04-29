import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { SensorData, SensorFeature } from '../types';

const API = `${process.env.REACT_APP_API_URL}/api/v1/sensors`;

export function useTemperatureData(selectedTime: string, network: string, bbox: string) {
  const [times, setTimes] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [features, setFeatures] = useState<SensorFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get<{ times: string[] }>(`${API}/times`),
      axios.get<{ networks: string[] }>(`${API}/networks`),
    ])
      .then(([timesRes, networksRes]) => {
        setTimes(timesRes.data.times);
        setNetworks(networksRes.data.networks);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fetchFeatures = useCallback(() => {
    if (!selectedTime) return;
    setLoading(true);
    const params: Record<string, string> = { time: selectedTime };
    if (network) params.network = network;
    if (bbox) params.bbox = bbox;

    axios
      .get<SensorData & { count: number }>(API, { params })
      .then((res) => {
        setFeatures(res.data.features);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedTime, network, bbox]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return { times, networks, features, loading, error };
}
