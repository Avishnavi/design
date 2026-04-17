import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const UserMapComponent = ({ userLocation, collectorLocation, isSelectionMode, onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mapError, setMapError] = useState(false);

  const isValidCoord = (coords) => {
    return Array.isArray(coords) && 
           coords.length === 2 && 
           typeof coords[0] === 'number' && !isNaN(coords[0]) &&
           typeof coords[1] === 'number' && !isNaN(coords[1]);
  };

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

  // 1. Initialize Map (Only once)
  useEffect(() => {
    if (map.current) return;

    const center = isValidCoord(userLocation) ? userLocation : [77.5946, 12.9716];
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: center,
        zoom: 14
      });

      // Add safety guard for missing images in the style
      map.current.on('styleimagemissing', (e) => {
        // Suppress console warnings for missing icons
        // Just log a small note to verify the listener is active
        console.debug(`Suppressing missing map icon: ${e.id}`);
      });

    } catch (err) {
      console.error('Failed to init map', err);
      setMapError(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 2. Handle Marker and Interaction Logic (Updates when props change)
  useEffect(() => {
    if (!map.current) return;

    const handleUpdate = () => {
      if (isSelectionMode) {
        if (!marker.current) {
          const markerPos = isValidCoord(userLocation) ? userLocation : map.current.getCenter().toArray();
          marker.current = new maplibregl.Marker({ color: "#27ae60", draggable: true })
            .setLngLat(markerPos)
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
        } else if (isValidCoord(userLocation)) {
          marker.current.setLngLat(userLocation);
        }
      } else {
        // Tracking Mode
        if (isValidCoord(userLocation)) {
          if (!map.current.userMarker) {
             map.current.userMarker = new maplibregl.Marker({ color: "#27ae60" })
              .setLngLat(userLocation)
              .addTo(map.current);
          } else {
            map.current.userMarker.setLngLat(userLocation);
          }
        }

        if (isValidCoord(collectorLocation)) {
          if (!map.current.collectorMarker) {
            map.current.collectorMarker = new maplibregl.Marker({ color: "#e67e22" })
              .setLngLat(collectorLocation)
              .addTo(map.current);
          } else {
            map.current.collectorMarker.setLngLat(collectorLocation);
          }
        }
      }
    };

    if (map.current.loaded()) handleUpdate();
    else map.current.once('load', handleUpdate);

  }, [isSelectionMode, userLocation, collectorLocation]);

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
