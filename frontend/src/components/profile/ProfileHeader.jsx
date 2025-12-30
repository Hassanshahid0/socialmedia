import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import FollowButton from '../follow/FollowButton';
import ProfileEdit from './ProfileEdit';
import FollowersList from './FollowersList';
import FollowingList from './FollowingList';
import Modal from '../common/Modal';
import { messageService } from '../../services/messageService';
import toast from 'react-hot-toast';

const ProfileHeader = ({ profile, isOwnProfile, onFollowChange, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const handleMessageClick = async () => {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const response = await messageService.startConversation(profile._id);
      const conversationId = response.data.conversation._id;
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={profile.profileImage}
              alt={profile.username}
              size="2xl"
            />
            {profile.role === 'creator' && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full">
                Creator
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {profile.username}
              </h1>
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <FollowButton
                    userId={profile._id}
                    initialFollowing={profile.isFollowing}
                    onFollowChange={onFollowChange}
                  />
                  <button
                    onClick={handleMessageClick}
                    disabled={startingChat}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {startingChat ? 'Opening...' : 'Message'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <span className="font-bold text-gray-800">{profile.postsCount || 0}</span>
                <span className="text-gray-500 ml-1">posts</span>
              </div>
              <button
                onClick={() => setShowFollowers(true)}
                className="text-center hover:opacity-70"
              >
                <span className="font-bold text-gray-800">{profile.followersCount || 0}</span>
                <span className="text-gray-500 ml-1">followers</span>
              </button>
              <button
                onClick={() => setShowFollowing(true)}
                className="text-center hover:opacity-70"
              >
                <span className="font-bold text-gray-800">{profile.followingCount || 0}</span>
                <span className="text-gray-500 ml-1">following</span>
              </button>
            </div>

            {/* Name & Bio */}
            <div>
              <p className="font-semibold text-gray-800">{profile.fullName}</p>
              {profile.bio && (
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <ProfileEdit
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updates) => {
            onProfileUpdate(updates);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Followers Modal */}
      <Modal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
      >
        <FollowersList userId={profile._id} />
      </Modal>

      {/* Following Modal */}
      <Modal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
      >
        <FollowingList userId={profile._id} />
      </Modal>
    </>
  );
};

export default ProfileHeader;
