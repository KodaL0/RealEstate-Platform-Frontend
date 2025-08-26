import { useState, useEffect } from 'react';
import { Building2, Globe, Mail, Phone, Calendar, MapPin, Edit3, Save, X, Upload, Camera } from 'lucide-react';
import developersApi, { DeveloperOrganization } from '../../config/developers-api';

interface ProfileProps {
  organization: DeveloperOrganization;
  onUpdate?: () => void;
}

export default function Profile({ organization, onUpdate }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DeveloperOrganization>>({
    name: organization?.name || '',
    description: organization?.description || '',
    country: organization?.country || '',
    website: organization?.website || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    logo: organization?.logo || '',
    established: organization?.established || undefined
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logo || null);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        country: organization.country || '',
        website: organization.website || '',
        email: organization.email || '',
        phone: organization.phone || '',
        logo: organization.logo || '',
        established: organization.established || undefined
      });
      setLogoPreview(organization.logo || null);
    }
  }, [organization]);

  const handleInputChange = (field: keyof DeveloperOrganization, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = { ...formData };
      
      // If there's a new logo file, upload it first
      if (logoFile) {
        try {
          const logoResponse = await developersApi.organizations.uploadLogo(organization.id, logoFile);
          updateData.logo = logoResponse.data.logo_url;
        } catch (error) {
          console.error('Failed to upload logo:', error);
          alert('Failed to upload logo. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      await developersApi.organizations.patch(organization.id, updateData);
      setIsEditing(false);
      // Call the update callback to refresh data
      if (onUpdate) {
        onUpdate();
      }
      // Reset logo file state
      setLogoFile(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('An error occurred while updating the organization.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    setFormData({
      name: organization?.name || '',
      description: organization?.description || '',
      country: organization?.country || '',
      website: organization?.website || '',
      email: organization?.email || '',
      phone: organization?.phone || '',
      logo: organization?.logo || '',
      established: organization?.established || undefined
    });
    setLogoPreview(organization?.logo || null);
    setLogoFile(null);
  };

  if (isEditing) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Organization Profile</h1>
            <p className="text-slate-600 mt-1">Update your organization information and settings</p>
          </div>
          <button
            onClick={handleCancel}
            className="group inline-flex items-center space-x-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300"
          >
            <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="font-medium">Cancel</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Logo Section */}
          <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white/50">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-slate-600" />
              Organization Logo
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-slate-200/50 border border-white/50">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors file:shadow-sm"
                />
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-slate-600 font-medium">Recommended: 200x200px, PNG or JPG</p>
                  <p className="text-xs text-slate-500">Maximum file size: 5MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-slate-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Organization Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+357 123 456 789"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={formData.established || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('established', value ? parseInt(value) : undefined);
                    }}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="2024"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Organization Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                placeholder="Describe your organization, mission, expertise, and what makes you unique..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-200/60 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center space-x-2 px-6 py-3 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Profile</h1>
          <p className="text-slate-600 mt-1">Manage your organization information and settings</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="group inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
          <Edit3 className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span>Edit Profile</span>
        </button>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 bg-gradient-to-r from-slate-50/50 to-white/50 border-b border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-slate-200/50 border border-white/50">
                {organization?.logo ? (
                  <img src={organization.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{organization?.name || 'Your Organization'}</h2>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Developer Account
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization Name
                </label>
                <div className="text-lg font-medium text-slate-900 bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.name || 'Not specified'}
                </div>
              </div>
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Country
                </label>
                <div className="text-lg font-medium text-slate-900 bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.country || 'Not specified'}
                </div>
              </div>
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Established
                </label>
                <div className="text-lg font-medium text-slate-900 bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.established || 'Not specified'}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </label>
                <div className="bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.website ? (
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {organization.website}
                    </a>
                  ) : (
                    <span className="text-lg font-medium text-slate-900">Not specified</span>
                  )}
                </div>
              </div>
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </label>
                <div className="bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.email ? (
                    <a 
                      href={`mailto:${organization.email}`} 
                      className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {organization.email}
                    </a>
                  ) : (
                    <span className="text-lg font-medium text-slate-900">Not specified</span>
                  )}
                </div>
              </div>
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-slate-500 mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </label>
                <div className="bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-200/60">
                  {organization?.phone ? (
                    <a 
                      href={`tel:${organization.phone}`} 
                      className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {organization.phone}
                    </a>
                  ) : (
                    <span className="text-lg font-medium text-slate-900">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-500">Organization Description</label>
            <div className="bg-slate-50/50 px-6 py-4 rounded-xl border border-slate-200/60">
              <p className="text-slate-700 leading-relaxed">
                {organization?.description || 'No description provided. Click "Edit Profile" to add a description of your organization, mission, and expertise.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Last updated: {organization?.updated_at ? new Date(organization.updated_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Unknown'}
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">Profile Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}