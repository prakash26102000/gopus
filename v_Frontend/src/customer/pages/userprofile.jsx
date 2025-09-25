import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Edit2, XCircleIcon, Camera, Calendar, Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL, getImageUrl } from '../../util';
// import BackgroundParticles from '../components/BackgroundParticles';

const UserProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const hasCalledApi = useRef(false);

  const fetchUserData = async (forceRefresh = false) => {
    if (hasCalledApi.current && !forceRefresh) {
      console.log('API already called, skipping...');
      return;
    }
    
    try {
      hasCalledApi.current = true;
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your profile');
        navigate('/login');
        return;
      }

      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${BASE_URL}/api/userprofile`, config);
      console.log("response",response)
      
      let profileData = null;
      if (response.data) {
        if (response.data.profile) {
          profileData = response.data.profile;
        } else if (response.data.user) {
          profileData = response.data.user;
        }
      }
      if (profileData) {
        const userData = {
          firstname: profileData.firstName || profileData.firstname || '',
          lastname: profileData.lastName || profileData.lastname || '',
          email: profileData.email || '',
          profilePicture: profileData.profilePicture || null,
          phoneNumber: profileData.phoneNumber || '',
          dateOfBirth: profileData.dateOfBirth || '',
          gender: profileData.gender || '',
          bio: profileData.bio || '',
          occupation: profileData.occupation || '',
          location: profileData.location || '',
          socialLinks: typeof profileData.socialLinks === 'string' 
            ? JSON.parse(profileData.socialLinks || '{}') 
            : (profileData.socialLinks || {})
        };
        
        setUserData(userData);
        setLoading(false);
      } else {
        console.log('No profile data found in response');
        setError('No profile data found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || 'Failed to fetch profile data');
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await axios.post(`${BASE_URL}/api/userprofile/picture`, formData, config);
      
      if (response.data.success) {
        toast.success('Profile picture updated successfully');
        // Refresh user data to get the new profile picture
        fetchUserData(true);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchUserData(true);
  }, []); // Empty dependency array - only run once on mount

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // This will return just the date part: YYYY-MM-DD
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative transition-colors duration-200">
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {/* <BackgroundParticles count={30} /> */}
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative transition-colors duration-200">
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {/* <BackgroundParticles count={30} /> */}
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleImageError = () => {
    console.log('Profile picture load failed');
    console.log('Attempted URL:', getImageUrl(userData?.profilePicture));
    console.log('Profile picture path:', userData?.profilePicture);
    console.log('BASE_URL:', BASE_URL);
    setImageError(true);
  };

  return (
    <div className="min-h-screen relative transition-colors duration-200 ">
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        {/* <BackgroundParticles count={30} /> */}
      </div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        {/* Profile Header */}
        <div className="relative rounded-xl shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden group">
                {userData?.profilePicture && !imageError ? (
                  <img 
                    src={getImageUrl(userData.profilePicture)}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                )}
                
                {/* Upload overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white"></div>
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userData?.firstname && userData?.lastname 
                    ? `${userData.firstname} ${userData.lastname}`
                    : 'User'}
                </h1>
                <p className="text-gray-500 break-words">{userData?.email}</p>
                {userData?.occupation && (
                  <p className="text-gray-500 text-sm flex items-center mt-1">
                    <Briefcase size={14} className="mr-1" />
                    {userData.occupation}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/edit-profile')}
              className="inline-flex items-center justify-center w-full sm:w-auto text-sm px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="relative rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-gray-900 break-words">{userData?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="text-gray-900 break-words">{formatDate(userData?.dateOfBirth)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Occupation</p>
                <p className="text-gray-900 break-words">{userData?.occupation || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-900 break-words">{userData?.gender || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-gray-900 break-words">{userData?.location || 'Not provided'}</p>
              </div>
            </div>

            {userData?.bio && (
              <div className="flex items-start space-x-3 col-span-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bio</p>
                  <p className="text-gray-900 mt-1 break-words">{userData.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;