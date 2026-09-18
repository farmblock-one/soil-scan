import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { API_BASE_URL } from "../config";

// Vite bundles leaflet's default marker icons under hashed URLs; without
// this the default icon silently fails to render.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapPoint {
  timestamp: string;
  lat: number;
  lng: number;
  location_label: string;
  soil_type: string;
  health_score: number;
  summary: string;
}

function healthColor(score: number) {
  if (score >= 70) return "#15803d";
  if (score >= 40) return "#b45309";
  return "#b91c1c";
}

export function CommunityMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/map-points`)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) throw new Error(body.error);
        setPoints(body.points || []);
      })
      .catch(() => setError("Không tải được dữ liệu bản đồ cộng đồng."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-6 text-center text-sm text-stone-500">Đang tải bản đồ...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  const center: [number, number] = points.length
    ? [points[points.length - 1].lat, points[points.length - 1].lng]
    : [16.0, 106.0];

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        {points.length > 0
          ? `${points.length} điểm đất đã được cộng đồng chia sẻ.`
          : "Chưa có dữ liệu nào. Hãy là người đầu tiên phân tích đất kèm vị trí!"}
      </p>
      <div className="overflow-hidden rounded-xl border border-stone-200" style={{ height: 420 }}>
        <MapContainer center={center} zoom={points.length ? 6 : 5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p, i) => (
            <Marker key={i} position={[p.lat, p.lng]}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{p.soil_type}</p>
                  <p style={{ color: healthColor(p.health_score) }}>Sức khỏe đất: {p.health_score}/100</p>
                  <p className="text-stone-600">{p.location_label}</p>
                  <p className="text-xs text-stone-400">{new Date(p.timestamp).toLocaleDateString("vi-VN")}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
