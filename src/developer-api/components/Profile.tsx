import { useState, useEffect } from 'react';
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
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold">Edit Organization Profile</h1>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6">
          {/* Logo Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden sm:mr-4 mr-0 mb-3 sm:mb-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🏢</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px, PNG or JPG</p>
                <p className="text-xs text-gray-400 mt-1">Max file size: 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+357 123 456 789"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder="Describe your organization, mission, and expertise..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Organization Profile</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Profile
        </button>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center sm:mr-4 mr-0 mb-3 sm:mb-0 overflow-hidden">
            {organization?.logo ? (
              <img src={organization.logo} alt="Organization logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🏢</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-medium">{organization?.name || 'Your Organization'}</h2>
            <p className="text-gray-600">Developer Account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Organization Name</label>
            <div className="text-sm font-medium">{organization?.name || 'Not specified'}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Type</label>
            <div className="text-sm font-medium">Developer</div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Country</label>
            <div className="text-sm font-medium">{organization?.country || 'Not specified'}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Established</label>
            <div className="text-sm font-medium">{organization?.established || 'Not specified'}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Website</label>
            <div className="text-sm font-medium">
              {organization?.website ? (
                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {organization.website}
                </a>
              ) : (
                'Not specified'
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <div className="text-sm font-medium">
              {organization?.email ? (
                <a href={`mailto:${organization.email}`} className="text-blue-600 hover:underline">
                  {organization.email}
                </a>
              ) : (
                'Not specified'
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Phone</label>
            <div className="text-sm font-medium">
              {organization?.phone ? (
                <a href={`tel:${organization.phone}`} className="text-blue-600 hover:underline">
                  {organization.phone}
                </a>
              ) : (
                'Not specified'
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Description</label>
          <p className="text-sm text-gray-700">
            {organization?.description || 'No description provided. Click "Edit Profile" to add a description of your organization.'}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {organization?.updated_at ? new Date(organization.updated_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}