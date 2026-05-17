import React, { useState, useRef } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import type { User } from '../types/user';
import { updateProfilePicture } from '../services/api';
import '../styles/ProfilePage.css';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(user.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        alert('Image too large. Please select an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!preview || preview === user.profilePicture) return;
    
    setSaving(true);
    try {
      await updateProfilePicture(user.id, preview);
      onUpdateUser({ ...user, profilePicture: preview });
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error('Failed to update profile picture', err);
      alert('Failed to update profile picture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">
              {preview ? (
                <img src={preview} alt="Profile" className="avatar-img" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <button 
              className="change-avatar-btn" 
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>ACCOUNT SETTINGS</h2>
          
          <div className="setting-item">
            <div className="setting-label">Profile Picture</div>
            <div className="setting-action">
              <button 
                className={`save-btn ${!preview || preview === user.profilePicture ? 'disabled' : ''}`}
                onClick={handleSave}
                disabled={saving || !preview || preview === user.profilePicture}
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Photo</>
                )}
              </button>
            </div>
          </div>

          <div className="settings-placeholder" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              More profile management features (change password, email preferences) coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
