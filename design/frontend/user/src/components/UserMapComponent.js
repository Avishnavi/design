import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const UserMapComponent = ({ userLocation, collectorLocation, isSelectionMode, onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const selectAddress = (result) => {
    const lng = parseFloat(result.lon);
    const lat = parseFloat(result.lat);
    const coords = [lng, lat];
    
    if (map.current) {
      map.current.flyTo({ center: coords, zoom: 16 });
      if (marker.current) marker.current.setLngLat(coords);
      onLocationSelect(coords);
    }
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: userLocation || [77.5946, 12.9716],
      zoom: 14
    });

    if (isSelectionMode) {
      marker.current = new maplibregl.Marker({ color: "#27ae60", draggable: true })
        .setLngLat(userLocation || [77.5946, 12.9716])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const lngLat = marker.current.getLngLat();
        onLocationSelect([lngLat.lng, lngLat.lat]);
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current.setLngLat([lng, lat]);
        onLocationSelect([lng, lat]);
      });
    } else {
      new maplibregl.Marker({ color: "#27ae60" })
        .setLngLat(userLocation)
        .addTo(map.current);

      if (collectorLocation) {
        map.current.collectorMarker = new maplibregl.Marker({ color: "#e67e22" })
          .setLngLat(collectorLocation)
          .addTo(map.current);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isSelectionMode]);

  return (
    <div className="map-with-search">
      {isSelectionMode && (
        <div className="map-search-container">
          <input 
            type="text" 
            placeholder="🔍 Search for your address..." 
            className="map-search-input"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((res, i) => (
                <div key={i} className="search-result-item" onClick={() => selectAddress(res)}>
                  {res.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '250px', borderRadius: '16px', marginBottom: '1.5rem', cursor: isSelectionMode ? 'crosshair' : 'default' }} />
    </div>
  );
};

export default UserMapComponent;
