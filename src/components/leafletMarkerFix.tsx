// leafletMarkerFix.js
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Remove the default _getIconUrl method so that our custom URLs are used
// biome-ignore lint/suspicious/noExplicitAny: Leaflet types don't expose _getIconUrl
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Merge custom options with the default Icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
