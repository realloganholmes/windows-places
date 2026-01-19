import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Papa from "papaparse";
import "./All.css";
import MarkerClusterGroup from "react-leaflet-cluster";

// Fix default marker icons for Leaflet + React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FlyTo({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 9, { duration: 3 });
    }
  }, [position, map]);

  return null;
}

export default function App() {
  const [locations, setLocations] = useState([]);
  const [flyTo, setFlyTo] = useState(null);
  const markerRefs = useRef({});
  const mapRef = useRef(null);
  const [selectedLuckyIndex, setSelectedLuckyIndex] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    fetch("/data.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        }).data
          .map((row) => {
            const lat = parseFloat(row.latitude);
            const lon = parseFloat(row.longitude);
            if (isNaN(lat) || isNaN(lon)) return null;
            return {
              title: row.title,
              image: row.image,
              date: row.date,
              lat,
              lon,
            };
          })
          .filter(Boolean);

        setLocations(parsed);
      });
  }, []);

  const feelingLucky = () => {
    if (!locations.length || isSpinning) return;

    setIsSpinning(true);

    const randomIndex = Math.floor(Math.random() * locations.length);
    const loc = locations[randomIndex];

    setSelectedLuckyIndex(randomIndex);

    setFlyTo([loc.lat, loc.lon]);

    setTimeout(() => setIsSpinning(false), 3000);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMoveEnd = () => {
      if (selectedLuckyIndex === null) return;

      const marker = markerRefs.current[selectedLuckyIndex];
      if (marker) {
        marker.openPopup();
        setSelectedLuckyIndex(null);
      }
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [selectedLuckyIndex]);

  return (
    <div className="h-screen w-screen">
      <button
        onClick={feelingLucky}
        className={`lucky-button ${isSpinning ? 'spinning' : ''}`}
        disabled={isSpinning}  // ← optional: prevent multiple clicks during spin
      >
        {isSpinning ? 'Spinning the Globe… 🎲' : "I'm Feeling Lucky"}
      </button>

      <MapContainer ref={mapRef} renderer={L.canvas()} center={[20, 0]} zoom={2} className="map-container" worldCopyJump={true}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {flyTo && <FlyTo position={flyTo} />}

        <MarkerClusterGroup
          chunkedLoading
          disableClusteringAtZoom={8}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          removeOutsideVisibleBounds={false}
        >
          {locations.map((loc, i) => (
            <Marker
              key={i}
              position={[loc.lat, loc.lon]}
              options={{ wrapLatLng: true }}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[i] = ref;
                }
              }}
            >
              <Popup maxWidth={300}>
                <div className="popup-content">
                  <div className="popup-title">{loc.title}</div>
                  <div className="popup-date">{loc.date}</div>
                  <img src={loc.image} className="popup-image" alt={loc.title} />
                  <a
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
                      loc.title
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="popup-link"
                  >
                    View images on Google
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}