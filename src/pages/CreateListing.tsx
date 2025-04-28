/* ──────────────────────────────────────────────────────────────
   pages/CreateListing.tsx   (country-code selector + flexible phone)
   ────────────────────────────────────────────────────────────── */

import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Home,
  DollarSign,
  MapPin,
  Building2,
  Bed,
  Bath,
  DotSquare as SquareFootage,
  Upload,
  X,
  Loader2,
} from "lucide-react";

import { apiClient } from "../middleware/auth";
import { useUser } from "../context/UserContext";

/* ───────────── Country dial-codes ───────────── */
const COUNTRY_CODES = [
  { code: "+357", label: "🇨🇾 +357" }, // CY default
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+30", label: "🇬🇷 +30" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+91", label: "🇮🇳 +91" },
];

/* ───────────── Reference lists ───────────── */
const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
  { value: "penthouse", label: "Penthouse" },
];

const PROPERTY_STATUS = [
  { value: "forSale", label: "For Sale" },
  { value: "forRent", label: "For Rent" },
];

const AMENITIES = [
  { id: "parking", label: "Parking" },
  { id: "pool", label: "Swimming Pool" },
  { id: "gym", label: "Gym" },
  { id: "security", label: "Security System" },
  { id: "ac", label: "Air Conditioning" },
  { id: "heating", label: "Central Heating" },
  { id: "laundry", label: "Laundry Facilities" },
  { id: "pets", label: "Pet Friendly" },
  { id: "furnished", label: "Furnished" },
  { id: "balcony", label: "Balcony" },
  { id: "storage", label: "Storage Space" },
  { id: "wifi", label: "High-Speed Internet" },
  { id: "dishwasher", label: "Dishwasher" },
  { id: "elevator", label: "Elevator" },
  { id: "fireplace", label: "Fireplace" },
  { id: "garden", label: "Garden" },
  { id: "roofDeck", label: "Roof Deck" },
  { id: "doorman", label: "Doorman" },
  { id: "garage", label: "Garage" },
  { id: "waterfront", label: "Waterfront" },
];

/* ───────────── Form types & defaults ───────────── */
interface ListingForm {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  images: File[];
  amenities: string[];
  yearBuilt: string;
  parkingSpaces: string;
  lotSize: string;
  propertyStatus: string;
  energyRating: string;
  constructionMaterial: string;
  floorLevel: string;
  totalFloors: string;
  availableFrom: string;
  contactPhone: string; // numeric part
  contactEmail: string;
  virtualTourUrl?: string;
  videoUrl?: string;
}

const DEFAULT_FORM_STATE: ListingForm = {
  title: "",
  description: "",
  price: "",
  location: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  area: "",
  images: [],
  amenities: [],
  yearBuilt: "",
  parkingSpaces: "",
  lotSize: "",
  propertyStatus: "",
  energyRating: "",
  constructionMaterial: "",
  floorLevel: "",
  totalFloors: "",
  availableFrom: "",
  contactPhone: "",
  contactEmail: "",
  virtualTourUrl: "",
  videoUrl: "",
};

/* ───────────── Component ───────────── */
export default function CreateListing() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { user } = useUser();
  const username = user?.username || "";

  /* state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ListingForm>(DEFAULT_FORM_STATE);

  /* NEW: country prefix */
  const [phonePrefix, setPhonePrefix] = useState("+357");

  /* images */
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);

  /* drop-zone */
  const onDrop = useCallback((accepted: File[]) => {
    setFormData(p => ({ ...p, images: [...p.images, ...accepted] }));
    setPreviewImages(p => [...p, ...accepted.map(f => URL.createObjectURL(f))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (i: number) => {
    setFormData(p => ({ ...p, images: p.images.filter((_, n) => n !== i) }));
    if (i < previewImages.length) URL.revokeObjectURL(previewImages[i]);
    setPreviewImages(p => p.filter((_, n) => n !== i));
    if (i < existingImageIds.length)
      setExistingImageIds(p => p.filter((_, n) => n !== i));
    if (i === primaryIndex) setPrimaryIndex(0);
    else if (i < primaryIndex) setPrimaryIndex(px => px - 1);
  };

  /* generic input handler */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleCheckboxChange = (id: string) => {
    setFormData(p => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter(a => a !== id)
        : [...p.amenities, id],
    }));
  };

  /* validation */
  const validateForm = () => {
    if (!formData.title.trim())
      return setError("Please enter a title"), false;
    if (!formData.description.trim())
      return setError("Please enter a description"), false;
    if (!formData.price || +formData.price <= 0)
      return setError("Enter a valid price"), false;
    if (!formData.location.trim())
      return setError("Please enter a location"), false;
    if (!formData.propertyType)
      return setError("Select a property type"), false;
    if (!formData.propertyStatus)
      return setError("Select a listing type"), false;
    if (
      formData.images.length === 0 &&
      previewImages.length === 0
    )
      return setError("Upload at least one image"), false;
    if (!formData.contactPhone.trim())
      return setError("Please enter a phone number"), false;
    return true;
  };

  /* load data in edit mode */
  useEffect(() => {
    if (!isEditing || !id) return;
    setLoading(true);
    apiClient
      .get(`/properties/${username}/property/${id}/`)
      .then(res => {
        const d = res.data;
        /* images */
        const urls = (d.images || []).map((i: any) =>
          typeof i === "string" ? i : i.image
        );
        const ids = (d.images || []).map((i: any) =>
          typeof i === "object" ? i.id || "" : ""
        );
        const prim = (d.images || []).findIndex((i: any) => i?.is_primary);
        setPreviewImages(urls);
        setExistingImageIds(ids);
        setPrimaryIndex(Math.max(0, prim));

        /* split phone */
        if (d.contact_phone) {
          const m = d.contact_phone.match(/^(\+\d{1,4})(.*)$/);
          if (m) {
            setPhonePrefix(m[1]);
            d.contact_phone = m[2].trim();
          }
        }

        /* map other fields */
        let status = d.property_status;
        if (status === "for_sale") status = "forSale";
        if (status === "for_rent") status = "forRent";

        const amenityIds = (d.amenities || []).map((lab: string) => {
          const found = AMENITIES.find(
            a => a.label.toLowerCase() === lab.toLowerCase()
          );
          return found ? found.id : null;
        }).filter(Boolean) as string[];

        setFormData({
          title: d.title || "",
          description: d.description || "",
          price: d.price?.toString() || "",
          location: d.location || "",
          propertyType: d.property_type || "",
          bedrooms: d.bedrooms?.toString() || "",
          bathrooms: d.bathrooms?.toString() || "",
          area: d.area?.toString() || "",
          images: [],
          amenities: amenityIds,
          yearBuilt: d.year_built?.toString() || "",
          parkingSpaces: d.parking_spaces?.toString() || "",
          lotSize: d.lot_size?.toString() || "",
          propertyStatus: status || "",
          energyRating: d.energy_rating || "",
          constructionMaterial: d.construction_material || "",
          floorLevel: d.floor_level?.toString() || "",
          totalFloors: d.total_floors?.toString() || "",
          availableFrom: d.available_from || "",
          contactPhone: d.contact_phone || "",
          contactEmail: d.contact_email || "",
          virtualTourUrl: d.virtual_tour_url || "",
          videoUrl: d.video_url || "",
        });
      })
      .catch(() => {
        setError("Failed to load property data.");
        toast.error("Could not load property data");
      })
      .finally(() => setLoading(false));
  }, [isEditing, id, username]);

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isEditing && !username) {
      toast.error("User data unavailable. Refresh and try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      /* images */
      if (formData.images.length) {
        const primary = Math.min(primaryIndex, formData.images.length - 1);
        const ordered = [
          formData.images[primary],
          ...formData.images.filter((_, i) => i !== primary),
        ];
        ordered.forEach(f => fd.append("images[]", f));
      }
      if (isEditing && previewImages.length) {
        previewImages.forEach((_, i) => {
          if (!formData.images[i]) {
            const id = existingImageIds[i] || previewImages[i];
            fd.append("existing_images[]", id);
            if (i === primaryIndex) fd.append("primary_image_id", id);
          }
        });
      }
      fd.append("primary_is_first", "true");

      /* fields */
      Object.entries(formData).forEach(([k, v]) => {
        if (k === "images") return;
        if (k === "contactPhone") {
          fd.append("contactPhone", `${phonePrefix}${v}`);
        } else if (Array.isArray(v)) {
          v.forEach(val => fd.append(`${k}[]`, val));
        } else if (v) fd.append(k, v.toString());
      });

      const endpoint = isEditing
        ? `/properties/${username}/property/${id}/edit/`
        : "/properties/create_property/";
      const method = isEditing ? "put" : "post";
      const res = await apiClient[method](endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status >= 200 && res.status < 300) {
        toast.success(isEditing ? "Listing updated!" : "Listing created!");
        navigate("/my-listings");
      } else setError(`Unexpected response ${res.status}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Failed to process listing. Try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───────────── early loading ───────────── */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading property data…</p>
      </div>
    );

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Home className="mr-3 h-8 w-8" />
              {isEditing ? "Edit Property Listing" : "Create New Property Listing"}
            </h1>
            <p className="text-blue-100 mt-2">
              {isEditing
                ? "Update the details below to modify your property listing"
                : "Fill in the details below to list your property"}
            </p>
          </div>

          {/* error banner */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-8 my-6">
              <div className="flex">
                <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {/* ───── Basic Information ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Luxurious Waterfront Penthouse"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="propertyStatus"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Listing Type
                  </label>
                  <select
                    id="propertyStatus"
                    name="propertyStatus"
                    value={formData.propertyStatus}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status</option>
                    {PROPERTY_STATUS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter price"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="Full address"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ───── Property Details ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      {PROPERTY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="bathrooms"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Living Area (sq m)
                  </label>
                  <div className="relative">
                    <SquareFootage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="area"
                      type="number"
                      min="0"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    name="yearBuilt"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    placeholder="YYYY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size (sq m)
                  </label>
                  <input
                    name="lotSize"
                    type="number"
                    min="0"
                    value={formData.lotSize}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* ───── Images ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Property Images
              </h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop images here, or click to select files
                </p>
                <p className="text-xs text-gray-500">
                  Max 10 images • up to 5 MB each
                </p>
              </div>

              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((src, i) => (
                    <div key={src} className="relative group">
                      <img
                        src={src}
                        className={`h-24 w-full object-cover rounded-lg ${
                          i === primaryIndex ? "border-4 border-blue-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimaryIndex(i)}
                        className="absolute bottom-1 left-1 bg-blue-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 text-xs"
                      >
                        Set Primary
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ───── Amenities ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AMENITIES.map(a => (
                  <label key={a.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(a.id)}
                      onChange={() => handleCheckboxChange(a.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{a.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ───── Description ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Description
              </h2>
              <textarea
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Provide a detailed description of the property..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* ───── Contact Information ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="flex">
                    <select
                      value={phonePrefix}
                      onChange={e => setPhonePrefix(e.target.value)}
                      className="mr-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      pattern="\d{4,}" /* at least 4 digits */
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="12345678"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number only — prefix selected on the left.
                  </p>
                </div>
              </div>
            </section>

            {/* ───── Virtual Tour & Video ───── */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Virtual Tour & Video
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Virtual Tour URL (optional)
                  </label>
                  <input
                    name="virtualTourUrl"
                    type="url"
                    value={formData.virtualTourUrl}
                    onChange={handleInputChange}
                    placeholder="Matterport or similar link"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (optional)
                  </label>
                  <input
                    name="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder="YouTube or Vimeo link"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* ───── Submit button ───── */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-8 py-4 rounded-xl text-white font-semibold text-lg ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } transition-colors shadow-lg`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                    {isEditing ? "Updating…" : "Creating…"}
                  </>
                ) : isEditing ? (
                  "Update Listing"
                ) : (
                  "Create Listing"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;
