import React, { useState, useEffect, useRef } from 'react';

const GoogleMapsComponent = ({ 
  center = { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
  zoom = 12,
  height = '400px',
  width = '100%',
  markers = [],
  onMapClick = null,
  onMarkerClick = null,
  showUserLocation = true,
  mapType = 'customer', // 'customer', 'vendor', 'admin', 'delivery'
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  // Initialize map
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeControl: mapType === 'admin',
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: getMapStyles(mapType)
    });

    setMap(mapInstance);
    
    const infoWindowInstance = new window.google.maps.InfoWindow();
    setInfoWindow(infoWindowInstance);

    // Add click listener if provided
    if (onMapClick) {
      mapInstance.addListener('click', (event) => {
        onMapClick({
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        });
      });
    }

    // Get user location if enabled
    if (showUserLocation) {
      getUserLocation(mapInstance);
    }
  };

  // Get user's current location
  const getUserLocation = (mapInstance) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(userPos);
          
          // Add user location marker
          const userMarker = new window.google.maps.Marker({
            position: userPos,
            map: mapInstance,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285f4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          // Center map on user location for customer maps
          if (mapType === 'customer') {
            mapInstance.setCenter(userPos);
            mapInstance.setZoom(14);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  };

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers = markers.map(markerData => {
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: map,
        title: markerData.title || 'Location',
        icon: getMarkerIcon(markerData.type || mapType)
      });

      // Add click listener
      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
        
        if (infoWindow && markerData.infoContent) {
          infoWindow.setContent(markerData.infoContent);
          infoWindow.open(map, marker);
        }
      });

      return marker;
    });

    setMapMarkers(newMarkers);

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });

      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) map.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [markers, map, userLocation, infoWindow, onMarkerClick, mapType]);

  // Get map styles based on type
  const getMapStyles = (type) => {
    const baseStyles = [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      }
    ];

    if (type === 'delivery') {
      return [
        ...baseStyles,
        {
          featureType: 'transit',
          stylers: [{ visibility: 'simplified' }]
        },
        {
          featureType: 'road',
          stylers: [{ visibility: 'simplified' }]
        }
      ];
    }

    return baseStyles;
  };

  // Get marker icon based on type
  const getMarkerIcon = (type) => {
    const icons = {
      vendor: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#ea4335',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        rotation: 90
      },
      customer: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#34a853',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      delivery: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 8,
        fillColor: '#fbbc04',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      admin: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: '#4285f4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    };

    return icons[type] || icons.vendor;
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }} 
      />
      {!window.google && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4285f4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p>Loading Maps...</p>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleMapsComponent;