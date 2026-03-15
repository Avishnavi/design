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
  }, [isSelectionMode, userLocation]); // Fixed dependency

  return (
    <div className="map-with-search-enhanced">
      {isSelectionMode && (
        <div className="search-layer">
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search for your locality or building..." 
              className="search-input-fancy"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => {setSearchQuery(''); setSearchResults([]);}}>✕</button>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-dropdown-fancy">
              {searchResults.map((res, i) => (
                <div key={i} className="search-item-fancy" onClick={() => selectAddress(res)}>
                  <span className="pin-icon">📍</span>
                  <div className="item-text">
                    <p className="main-text">{res.display_name.split(',')[0]}</p>
                    <p className="sub-text">{res.display_name.split(',').slice(1).join(',')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={mapContainer} className="mini-map-frame" style={{ width: '100%', height: '280px', borderRadius: '24px', cursor: isSelectionMode ? 'crosshair' : 'default' }} />
    </div>
  );
};

export default UserMapComponent;
