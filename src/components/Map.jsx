import GoogleMapView from './GoogleMapView';
import MapLibreMap from './MapLibreMap';
import { isGoogleMapsConfigured } from '../services/googleMaps';

export default function Map(props) {
  if (isGoogleMapsConfigured()) {
    return <GoogleMapView {...props} />;
  }

  return <MapLibreMap {...props} />;
}
