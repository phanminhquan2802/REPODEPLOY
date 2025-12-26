import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaKey, FaCheckCircle } from 'react-icons/fa';
import { authAPI } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập mã xác nhận, 3: Đặt mật khẩu mới, 4: Thành công
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Bước 1: Gửi email với mã xác nhận
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data) {
        setStep(2); // Chuyển sang bước nhập mã
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận mã và chuyển sang đặt mật khẩu mới
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (resetCode.length !== 6) {
      setError('Mã xác nhận phải có 6 chữ số');
      setLoading(false);
      return;
    }

    try {
      // Chỉ kiểm tra mã, chưa đặt mật khẩu
      // Nếu mã hợp lệ, chuyển sang bước đặt mật khẩu mới
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã xác nhận không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(email, resetCode, newPassword);
      setStep(4); // Thành công
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Màn hình thành công
  if (step === 4 && success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FaCheckCircle className="text-green-600 text-4xl" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Đặt lại mật khẩu thành công!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại với mật khẩu mới.
            </p>
            
            <Link
              to="/login"
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-block"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold mb-2">
            <span className="text-gray-800">SMART</span>
          </Link>
          <p className="text-gray-600">
            {step === 1 && 'Khôi phục mật khẩu'}
            {step === 2 && 'Nhập mã xác nhận'}
            {step === 3 && 'Đặt mật khẩu mới'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Bước 1: Nhập email */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quên mật khẩu</h2>
              <p className="text-sm text-gray-600 mb-6">
                Nhập email để nhận mã xác nhận đặt lại mật khẩu
              </p>

              <form onSubmit={handleSendCode} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nhập email của bạn"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-semibold text-red-600 hover:underline"
                  >
                    <FaArrowLeft className="mr-2" />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* Bước 2: Nhập mã xác nhận */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Nhập mã xác nhận</h2>
              <p className="text-sm text-gray-600 mb-6">
                Chúng tôi đã gửi mã xác nhận 6 chữ số đến email <strong>{email}</strong>.
                Vui lòng kiểm tra hộp thư và nhập mã bên dưới.
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã xác nhận
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Mã có hiệu lực trong 10 phút
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || resetCode.length !== 6}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang xác nhận...' : 'Xác nhận mã'}
                </button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Gửi lại mã
                  </button>
                  <br />
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-semibold text-red-600 hover:underline"
                  >
                    <FaArrowLeft className="mr-2" />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* Bước 3: Đặt mật khẩu mới */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt mật khẩu mới</h2>
              <p className="text-sm text-gray-600 mb-6">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn
              </p>

              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nhập lại mật khẩu mới"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Quay lại nhập mã
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
