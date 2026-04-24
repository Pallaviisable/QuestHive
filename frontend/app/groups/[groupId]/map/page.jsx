'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getGroupLocations, updateLocation, getGroupDetail } from '@/lib/api';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

// Reverse geocode lat/lng → address using OpenStreetMap (free, no API key)
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    // Return short address: area + city
    const { suburb, city, town, village, state } = data.address;
    return `${suburb || town || village || ''}, ${city || state || ''}`.trim();
  } catch {
    return '';
  }
};

export default function MapPage() {
  const { groupId } = useParams();
  const [locations, setLocations] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [msg, setMsg] = useState('');
  const watchRef = useRef(null);

  useEffect(() => {
    fetchLocations();
    fetchGroup();

    const interval = setInterval(fetchLocations, 15000);
    return () => {
      clearInterval(interval);
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await getGroupDetail(groupId); // ← uses /detail now
      setGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await getGroupLocations(groupId);
      setLocations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setMsg('❌ Geolocation not supported.');
      return;
    }

    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);

    setSharing(true);
    setMsg('📡 Sharing live location...');

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // ← Get real address before saving
          const address = await reverseGeocode(latitude, longitude);

          await updateLocation({ latitude, longitude, address });
          fetchLocations();
        } catch (err) {
          console.error(err);
        }
      },
      (err) => {
        setMsg('❌ Location access denied.');
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const handleStopSharing = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setSharing(false);
    setMsg('🛑 Stopped sharing location.');
  };

  return (
    <div className="animate-fadeSlideUp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>🗺️ Group Map</h1>
          <p style={{ color: '#a0a0a0' }}>See where your hive members are</p>
        </div>
        {!sharing ? (
          <button className="btn-primary" onClick={handleShareLocation}>
            📍 Share My Location
          </button>
        ) : (
          <button className="btn-outline" onClick={handleStopSharing}>
            🛑 Stop Sharing
          </button>
        )}
      </div>

      {msg && (
        <div style={{
          background: sharing ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${sharing ? '#22c55e' : '#ef4444'}`,
          borderRadius: '8px', padding: '10px 14px',
          color: sharing ? '#22c55e' : '#ef4444',
          fontSize: '13px', marginBottom: '16px',
        }}>{msg}</div>
      )}

      {loading ? (
        <div style={{ color: '#f5c518', textAlign: 'center', padding: '40px' }}>Loading map...</div>
      ) : (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #2a2a2a', height: '500px' }}>
          <MapView locations={locations} members={group?.members || []} />
        </div>
      )}
    </div>
  );
}