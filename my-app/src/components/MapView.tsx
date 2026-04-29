import React, { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SensorFeature } from '../types';
import { tempToHex } from '../utils/colorScale';

interface MapViewProps {
  features: SensorFeature[];
  onBboxChange: (bbox: string | null) => void;
  activeBbox: string | null;
}

interface DragRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const BASEMAP_URL =
  'https://tile-1.kartenforum.slub-dresden.de/styles/maptiler-basic-v2/style.json';

// Center of the Dresden sensor area
const CENTER: [number, number] = [13.74, 51.065]; // Dresden
const ZOOM = 11;

function buildGeoJSON(features: SensorFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features
      .filter((f) => f.properties.v !== null && f.properties.v !== undefined)
      .map((f) => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          ...f.properties,
          uom: '°C',
          color: tempToHex(f.properties.v as number),
          tempLabel: `${(f.properties.v as number).toFixed(1)}°C`,
        },
      })),
  };
}

export const MapView: React.FC<MapViewProps> = ({ features, onBboxChange, activeBbox }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const pendingDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  // ref keeps the latest callback without re-running the drag effect
  const onBboxChangeRef = useRef(onBboxChange);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);

  useEffect(() => {
    onBboxChangeRef.current = onBboxChange;
  }, [onBboxChange]);

  const setSourceData = useCallback((data: GeoJSON.FeatureCollection) => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('sensors') as GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else {
      pendingDataRef.current = data;
    }
  }, []);

  // Shift+drag to draw a bounding box filter
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const map = mapRef.current;
      if (!map) return;
      map.dragPan.disable();
      const rect = wrapper.getBoundingClientRect();
      dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      isDraggingRef.current = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const rect = wrapper.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { x: sx, y: sy } = dragStartRef.current;
      setDragRect({
        left: Math.min(sx, cx),
        top: Math.min(sy, cy),
        width: Math.abs(cx - sx),
        height: Math.abs(cy - sy),
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      isDraggingRef.current = false;

      const map = mapRef.current;
      if (map) {
        map.dragPan.enable();
        const rect = wrapper.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const { x: sx, y: sy } = dragStartRef.current;
        const minX = Math.min(sx, cx);
        const minY = Math.min(sy, cy);
        const maxX = Math.max(sx, cx);
        const maxY = Math.max(sy, cy);

        if (maxX - minX > 5 && maxY - minY > 5) {
          const sw = map.unproject([minX, maxY] as [number, number]);
          const ne = map.unproject([maxX, minY] as [number, number]);
          const bbox = `${sw.lng.toFixed(5)},${sw.lat.toFixed(5)},${ne.lng.toFixed(5)},${ne.lat.toFixed(5)}`;
          onBboxChangeRef.current(bbox);
        }
      }

      dragStartRef.current = null;
      setDragRect(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && wrapperRef.current) {
        wrapperRef.current.style.cursor = 'crosshair';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && wrapperRef.current) {
        wrapperRef.current.style.cursor = '';
      }
    };

    wrapper.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      wrapper.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_URL,
      center: CENTER,
      zoom: ZOOM,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('sensors', {
        type: 'geojson',
        data: pendingDataRef.current ?? { type: 'FeatureCollection', features: [] },
      });
      pendingDataRef.current = null;

      map.addLayer({
        id: 'sensors-circle',
        type: 'circle',
        source: 'sensors',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9, 14,
            13, 22,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.88,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'sensors-label',
        type: 'symbol',
        source: 'sensors',
        layout: {
          'text-field': ['get', 'tempLabel'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 1.5,
        },
      });

      map.on('click', 'sensors-circle', (e) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties as Record<string, unknown>;
        const coords = (
          e.features[0].geometry as GeoJSON.Point
        ).coordinates as [number, number];

        const name = String(props.name || props.id);
        const temp = props.v !== null ? `${Number(props.v).toFixed(1)} °C` : 'N/A';
        const hi = props.hi !== null ? `${Number(props.hi).toFixed(1)} °C` : 'N/A';
        const lo = props.lo !== null ? `${Number(props.lo).toFixed(1)} °C` : 'N/A';
        const time = new Date(String(props.time)).toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const html = `
          <div class="sensor-popup">
            <div class="sensor-popup__title">${name}</div>
            <div class="sensor-popup__row"><span>Network</span><span>${props.network}</span></div>
            <div class="sensor-popup__row temp"><span>Temperature</span><span>${temp}</span></div>
            <div class="sensor-popup__row"><span>High</span><span>${hi}</span></div>
            <div class="sensor-popup__row"><span>Low</span><span>${lo}</span></div>
            <div class="sensor-popup__row"><span>Time</span><span>${time}</span></div>
          </div>
        `;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseenter', 'sensors-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'sensors-circle', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSourceData(buildGeoJSON(features));
  }, [features, setSourceData]);

  return (
    <div ref={wrapperRef} className="map-view-wrapper">
      <div ref={containerRef} className="map-view" />

      {dragRect && (
        <div
          className="bbox-drag-rect"
          style={{
            left: dragRect.left,
            top: dragRect.top,
            width: dragRect.width,
            height: dragRect.height,
          }}
        />
      )}

      {!activeBbox && !dragRect && (
        <div className="bbox-hint">Hold Shift + drag to filter by area</div>
      )}

      {activeBbox && (
        <button
          className="bbox-clear-btn"
          onClick={() => onBboxChangeRef.current(null)}
        >
          ✕ Clear area filter
        </button>
      )}
    </div>
  );
};
