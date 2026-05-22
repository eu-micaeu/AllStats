import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Loader2, Trash2, AlertTriangle, Eye, EyeOff, User as UserIcon, Mail, Lock } from 'lucide-react';
import type { User } from '../types/user';
import { updateProfilePicture, deleteAccount, updateProfile } from '../services/api';
import '../styles/ProfilePage.css';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, onLogout }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preview, setPreview] = useState<string | null>(user.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
  }, [user]);

  const isProfilePristine = () => {
    return username === user.username && 
           email === user.email && 
           password === '';
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (username.trim() === '') {
      setProfileMessage({ text: 'Username cannot be empty.', type: 'error' });
      return;
    }

    if (email.trim() === '') {
      setProfileMessage({ text: 'Email cannot be empty.', type: 'error' });
      return;
    }

    if (password !== '') {
      if (password.length < 6) {
        setProfileMessage({ text: 'Password must be at least 6 characters long.', type: 'error' });
        return;
      }
      if (password !== confirmPassword) {
        setProfileMessage({ text: 'Passwords do not match.', type: 'error' });
        return;
      }
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateProfile(user.id, {
        username: username.trim(),
        email: email.trim(),
        password: password !== '' ? password : undefined,
      });

      onUpdateUser(updatedUser);
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setProfileMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        showToast('Image too large. Please select an image under 1MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setPreview(base64Data);
        setSaving(true);
        try {
          await updateProfilePicture(user.id, base64Data);
          onUpdateUser({ ...user, profilePicture: base64Data });
          showToast('Profile picture updated successfully!', 'success');
        } catch (err) {
          console.error('Failed to update profile picture', err);
          showToast('Failed to update profile picture.', 'error');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(user.id);
      alert('Your account has been deleted.');
      onLogout();
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Failed to delete account. Please try again later.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">
              {saving ? (
                <Loader2 size={36} className="animate-spin" />
              ) : preview ? (
                <img src={preview} alt="Profile" className="avatar-img" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <button 
              className="change-avatar-btn" 
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
              disabled={saving}
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="settings-section">
          <form onSubmit={handleUpdateProfile} className="profile-edit-form">
            <h3 className="form-section-title">Account Details</h3>
            
            {profileMessage && (
              <div className={`profile-message-banner ${profileMessage.type}`}>
                {profileMessage.text}
              </div>
            )}

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="username">Nickname / Username</label>
                <div className="profile-input-wrapper">
                  <UserIcon size={18} className="profile-input-icon" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your nickname"
                    required
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="profile-input-wrapper">
                  <Mail size={18} className="profile-input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="password">New Password (Optional)</label>
                <div className="profile-input-wrapper">
                  <Lock size={18} className="profile-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a new password"
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="profile-input-wrapper">
                  <Lock size={18} className="profile-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                className={`save-btn ${isProfilePristine() || savingProfile ? 'disabled' : ''}`}
                disabled={isProfilePristine() || savingProfile}
              >
                {savingProfile ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving Changes...</>
                ) : (
                  <><Save size={18} /> Save Account Changes</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="danger-zone">
          <h2 className="danger-title">DANGER ZONE</h2>
          <div className="danger-card">
            <div className="danger-info">
              <h3>Delete Account</h3>
              <p>Permanently remove your account and all your data. This action cannot be undone.</p>
            </div>
            <button 
              className="delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="modal-content danger-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle color="var(--valorant-color)" size={32} />
              <h2>Delete Account?</h2>
            </div>
            <p>Are you sure you want to delete your account? This will permanently remove all your data, including favorites and profile settings.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <><Loader2 size={18} className="animate-spin" /> Deleting...</>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`profile-toast ${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : '⚠'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
