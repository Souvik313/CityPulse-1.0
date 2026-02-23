import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px"
};

export default function CityMap({ lat, lng, city }) {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat, lng }}
        zoom={12}
        options={{
          disableDefaultUI: true,
          zoomControl: true
        }}
      >
        <Marker position={{ lat, lng }} title={city} />
      </GoogleMap>
    </LoadScript>
  );
}
