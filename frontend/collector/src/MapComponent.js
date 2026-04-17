import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapComponent = ({ userLocation, collectorLocation, pickupStatus }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const collectorMarker = useRef(null);
  
  // Navigation mode is active only when "On The Way"
  const isNavigating = pickupStatus === 'On The Way';

  const isValid = (coords) => {
    return Array.isArray(coords) && 
           coords.length === 2 && 
           typeof coords[0] === 'number' && !isNaN(coords[0]) &&
           typeof coords[1] === 'number' && !isNaN(coords[1]) &&
           coords[0] !== 0 && coords[1] !== 0;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const initialCenter = isValid(collectorLocation) ? collectorLocation : [77.5946, 12.9716];

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: initialCenter,
        zoom: 14,
        pitch: 0 
      });

      // Add safety guard for missing images in the style
      map.current.on('styleimagemissing', (e) => {
        // Just log and prevent crash
        console.warn(`Map style image missing: ${e.id}. Ignoring to prevent crash.`);
      });

      const initRouteLayer = () => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        
        if (!map.current.getSource('route')) {
          map.current.addSource('route', { 
            'type': 'geojson', 
            'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': [] } } 
          });
        }

        if (!map.current.getLayer('route')) {
          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': { 
              'line-color': '#2ecc71', // Neon Green
              'line-width': 8, 
              'line-opacity': 0.9,
              'line-blur': 1
            }
          });
        }
      };

      map.current.on('load', initRouteLayer);
      map.current.on('styledata', initRouteLayer);
    } catch (err) {
      console.error("Map Init Error:", err);
    }

    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, []);

  // Sync Markers and Handle Dynamic View Modes
  useEffect(() => {
    if (!map.current) return;

    const applyViewMode = (routeCoords) => {
      if (isNavigating && isValid(collectorLocation)) {
        // TRAVEL MODE: 3D, Zoomed, Centered on Collector
        map.current.easeTo({
          center: collectorLocation,
          zoom: 16,
          pitch: 45,
          duration: 1000,
          essential: true
        });
      } else if (routeCoords && routeCoords.length > 0) {
        // OVERVIEW MODE: 2D, Fit entire route/both points
        const bounds = new maplibregl.LngLatBounds();
        routeCoords.forEach(c => bounds.extend(c));
        map.current.fitBounds(bounds, { padding: 80, pitch: 0, animate: true });
      }
    };

    const fetchRoute = async () => {
      if (isValid(userLocation) && isValid(collectorLocation)) {
        try {
          const query = `https://router.project-osrm.org/route/v1/driving/${collectorLocation[0]},${collectorLocation[1]};${userLocation[0]},${userLocation[1]}?overview=full&geometries=geojson`;
          const response = await fetch(query);
          const data = await response.json();
          if (data.routes?.[0]) {
            const routeGeoJSON = data.routes[0].geometry;
            const source = map.current.getSource('route');
            if (source) source.setData(routeGeoJSON);
            applyViewMode(routeGeoJSON.coordinates);
          }
        } catch (err) { console.error("Routing Error:", err); }
      }
    };

    if (map.current.loaded()) fetchRoute();
    else map.current.once('load', fetchRoute);

    // Update Markers
    if (isValid(userLocation)) {
      if (!userMarker.current) {
        const el = document.createElement('div');
        el.innerHTML = '<div style="font-size: 2.5rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3))">📍</div>';
        userMarker.current = new maplibregl.Marker({ element: el }).setLngLat(userLocation).addTo(map.current);
      } else userMarker.current.setLngLat(userLocation);
    }

    if (isValid(collectorLocation)) {
      if (!collectorMarker.current) {
        const el = document.createElement('div');
        el.innerHTML = '<div style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3))">🚛</div>';
        collectorMarker.current = new maplibregl.Marker({ element: el }).setLngLat(collectorLocation).addTo(map.current);
      } else collectorMarker.current.setLngLat(collectorLocation);
    }
  }, [userLocation, collectorLocation, pickupStatus, isNavigating]);

  if (!isValid(userLocation)) {
    return (
      <div className="map-error-new">
        <span style={{ fontSize: '3rem' }}>🛰️</span>
        <h3>Waiting for Location Data</h3>
        <div className="spinner-wave"><div></div><div></div><div></div></div>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <div className="map-overlay-info">
        <div className="view-mode-badge">
          {isNavigating ? '🚀 Travel Mode' : '🗺️ Overview Mode'}
        </div>
        <div className="dist-badge">Optimized Route</div>
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default MapComponent;
