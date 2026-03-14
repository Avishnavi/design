import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapComponent = ({ userLocation, collectorLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const collectorMarker = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: collectorLocation || [77.5946, 12.9716],
      zoom: 13
    });

    map.current.on('load', () => {
      // Add Route Source
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [collectorLocation, userLocation]
          }
        }
      });

      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': { 'line-join': 'round', 'line-cap': 'round' },
        'paint': { 'line-color': '#3498db', 'line-width': 4, 'line-dasharray': [2, 1] }
      });

      // Initial Fit Bounds
      const bounds = new maplibregl.LngLatBounds()
        .extend(userLocation)
        .extend(collectorLocation);
      map.current.fitBounds(bounds, { padding: 50 });
    });

    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Sync Markers and Route when locations change
  useEffect(() => {
    if (!map.current) return;

    // Update User Marker
    if (!userMarker.current) {
      userMarker.current = new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat(userLocation)
        .setPopup(new maplibregl.Popup().setHTML("🏠 User Pickup Location"))
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(userLocation);
    }

    // Update Collector Marker
    if (!collectorMarker.current) {
      collectorMarker.current = new maplibregl.Marker({ color: "#3498db" })
        .setLngLat(collectorLocation)
        .setPopup(new maplibregl.Popup().setHTML("🚚 Your Current Position"))
        .addTo(map.current);
    } else {
      collectorMarker.current.setLngLat(collectorLocation);
    }

    // Update Route Source
    const source = map.current.getSource('route');
    if (source) {
      source.setData({
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': [collectorLocation, userLocation]
        }
      });
    }
  }, [userLocation, collectorLocation]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} style={{ width: '100%', height: '300px', borderRadius: '12px' }} />
      <div className="map-stats card">
        <p>🗺️ Powered by <strong>OpenFreeMap</strong></p>
        <p>📍 Live Tracking Active</p>
      </div>
    </div>
  );
};

export default MapComponent;
