'use client'

import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  sender: 'user' | 'assistant';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ sender }) => {
  const avatarSrc = sender === 'user' ? '/avatars/user.png' : '/avatars/assistant.png';

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden">
      <Image src={avatarSrc} alt={sender} width={32} height={32} />
    </div>
  );
};

export default UserAvatar;