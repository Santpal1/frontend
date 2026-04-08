import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';
import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, username }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const validatePasswords = (): boolean => {
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return false;
    }
    if (!newPassword.trim()) {
      setError('New password is required');
      return false;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('handleChangePassword called'); // Debug log
    setError('');

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      // Get user from localStorage to get userId
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;

      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://srm-sp-production-dc63.up.railway.app/api/password/change',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            'user-id': userId.toString(),
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength(0);
        
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err: unknown) {
      let errorMessage = 'An error occurred while changing password';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosErr.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStrength(0);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e', '#16a34a'];

  // Check if button should be enabled
  const isButtonDisabled = loading || !currentPassword || !newPassword || !confirmPassword;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Change Password</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            disabled={loading || success}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <CheckCircle size={48} />
            <p className={styles.successText}>Password changed successfully!</p>
            <p className={styles.successSubtext}>You can now use your new password to log in.</p>
          </div>
        ) : (
          <>
            <div className={styles.form}>
              <div className={styles.userInfo}>
                <p className={styles.infoText}>
                  Changing password for: <strong>{username}</strong>
                </p>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              {/* Current Password */}
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Current Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={styles.toggleButton}
                    disabled={loading}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Enter a new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={styles.toggleButton}
                    disabled={loading}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {newPassword && (
                  <div className={styles.strengthMeter}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength],
                        }}
                      />
                    </div>
                    <span
                      className={styles.strengthText}
                      style={{ color: strengthColors[passwordStrength] }}
                    >
                      {strengthLabels[passwordStrength]} Password
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.toggleButton}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword === confirmPassword && (
                  <p className={styles.matchText}>✓ Passwords match</p>
                )}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className={styles.mismatchText}>✗ Passwords do not match</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className={styles.requirements}>
                <p className={styles.requirementsTitle}>Password Requirements:</p>
                <ul>
                  <li className={newPassword.length >= 6 ? styles.met : ''}>
                    At least 6 characters
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? styles.met : ''}>
                    At least one uppercase letter
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? styles.met : ''}>
                    At least one number
                  </li>
                </ul>
              </div>
            </div>

            {/* Buttons - Moved outside form div */}
            <div className={styles.footer}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                className={styles.submitButton}
                disabled={isButtonDisabled}
                style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <>
                    <Loader size={18} className={styles.spinner} />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;