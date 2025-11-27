import { useEffect, useState } from "react";

// Uses the browser Geolocation API when the user allows it. Falls back to
// null silently (denied / unsupported / no HTTPS) - callers should treat
// null coords as "use the server's mock distance" rather than blocking.
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | locating | granted | denied | unsupported

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, status };
}
