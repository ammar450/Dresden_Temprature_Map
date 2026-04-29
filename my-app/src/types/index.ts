export interface SensorProperties {
  time: string;
  v: number | null;
  id: string;
  hi: number | null;
  lo: number | null;
  c: number;
  uom: string;
  network: string;
  description: string;
  name: string;
  color?: string;
}

export interface SensorFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: SensorProperties;
}

export interface SensorData {
  type: 'FeatureCollection';
  features: SensorFeature[];
}
