import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "./GeoGuess.css";

// --- helpers ---
const STORAGE_KEY = "screensaver-geoguess";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function seededShuffle(array, seed) {
  let m = array.length;
  let i;
  const result = [...array];
  let random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  while (m) {
    i = Math.floor(random() * m--);
    [result[m], result[i]] = [result[i], result[m]];
  }
  return result;
}

function GuessClick({ onGuess }) {
  useMapEvents({
    click(e) {
      onGuess(e.latlng);
    }
  });
  return null;
}

export default function GeoGuess() {
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch("/data.csv")
      .then(res => res.text())
      .then(text => {
        const data = Papa.parse(text, { header: true, skipEmptyLines: true }).data
          .map(r => ({
            title: r.title,
            image: r.image,
            lat: parseFloat(r.latitude),
            lon: parseFloat(r.longitude),
          }))
          .filter(r => !isNaN(r.lat) && !isNaN(r.lon));

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const seed = stored.seed ?? Math.floor(Math.random() * 1e9);
        const shuffled = stored.order ?? seededShuffle(data, seed);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            seed,
            order: shuffled,
            index: stored.index + 1 ?? 0,
          })
        );

        setOrder(shuffled);
        setIndex(stored.index ?? 0);
      });
  }, []);

  if (!order.length) return null;

  const current = order[index];
  const actual = [current.lat, current.lon];

  const submitGuess = () => setRevealed(true);

  function normalizeLon(lon) {
    return ((lon + 180) % 360 + 360) % 360 - 180;
  }

  const trySetGuess = (g) => {
    if (!revealed) {
      setGuess({
        lat: g.lat,
        lng: normalizeLon(g.lng),
      });
    }
  };

  const next = () => {
    const nextIndex = (index + 1) % order.length;
    setIndex(nextIndex);
    setGuess(null);
    setRevealed(false);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(STORAGE_KEY)),
        index: nextIndex,
      })
    );
  };

  const distance =
    guess && revealed
      ? haversine(
        guess.lat,
        guess.lng,
        current.lat,
        normalizeLon(current.lon)
      ).toFixed(1)
      : null;

  return (
    <div className="geoguess-container">
      <div className="geoguess-image-wrapper">
        <img src={current.image} alt='guess what it is' />
        <div className="geoguess-hint">Click on the map to guess</div>
        {revealed ?
          <a
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
              current.title
            )}`}
            target="_blank"
            rel="noreferrer"
            class="link"
          >
            <div>{current.title}</div>
          </a>
          : ''}
      </div>

      <MapContainer removeOutsideVisibleBounds={false} worldCopyJump={true} center={[20, 0]} zoom={2} className="geoguess-map">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; Wikimedia Maps"
          url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png?lang=en"
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        <GuessClick onGuess={trySetGuess} />

        {guess && <Marker options={{ wrapLatLng: true }} position={guess} />}
        {revealed && <Marker options={{ wrapLatLng: true }} position={actual} />}

        {guess && revealed && (
          <Polyline
            positions={[guess, actual]}
            pathOptions={{ interactive: false }}
          />
        )}
      </MapContainer>

      <div className="geoguess-controls">
        {!revealed && (
          <button disabled={!guess} onClick={submitGuess} className="geoguess-button">
            Submit Guess
          </button>
        )}

        {revealed && (
          <div>
            <div>You were <b>{distance} km</b> away</div>
            <button onClick={next}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
