import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { FaLock, FaSave } from 'react-icons/fa';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const profileData = response.data;
      // Get address from localStorage if available
      const savedAddress = localStorage.getItem(`user_address_${profileData._id}`) || '';
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        address: savedAddress,
        phone: profileData.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate password change if any password field is filled
      const isChangingPassword = 
        passwordData.currentPassword || 
        passwordData.newPassword || 
        passwordData.confirmPassword;

      if (isChangingPassword) {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
          setError('Vui lòng điền đầy đủ thông tin mật khẩu');
          setSaving(false);
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('Mật khẩu mới và xác nhận không khớp');
          setSaving(false);
          return;
        }

        if (passwordData.newPassword.length < 6) {
          setError('Mật khẩu mới phải có ít nhất 6 ký tự');
          setSaving(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
      };

      if (isChangingPassword) {
        // Verify current password by attempting login
        try {
          await authAPI.login({ 
            email: formData.email, 
            password: passwordData.currentPassword 
          });
        } catch (loginError) {
          setError('Mật khẩu hiện tại không đúng');
          setSaving(false);
          return;
        }
        updateData.password = passwordData.newPassword;
      }

      // Update profile
      const response = await authAPI.updateProfile(updateData);
      
      // Update localStorage with new token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const { token, ...userData } = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // Save address to localStorage (backend doesn't support address field)
      if (response.data._id) {
        localStorage.setItem(`user_address_${response.data._id}`, formData.address);
      }

      setSuccess('Cập nhật thông tin thành công');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ của tôi</h1>

          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <FaLock className="text-orange-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h2>
              </div>

              <div className="space-y-4">
                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>

                {/* Xác nhận */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

