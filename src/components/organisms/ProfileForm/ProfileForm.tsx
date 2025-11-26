// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import './ProfileForm.css';
import ProfilePhotoField from 'components/molecules/inputs/ProfilePhotoField/ProfilePhotoField';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import TextAreaField from 'components/molecules/inputs/TextAreaField/TextAreaField';

type Props = {
  userPhoto: File | undefined;
  setUserPhoto: (file: File | undefined) => void;
  originalUserPhotoUrl?: string;
  username: string;
  setUsername: (username: string) => void;
  usernameError?: string;
  bio: string;
  setBio: (bio: string) => void;
}

const ProfileForm: React.FC<Props> = (props) => {
  const {
    userPhoto,
    setUserPhoto,
    username,
    setUsername,
    usernameError,
    bio,
    setBio
  } = props;
  return (<div className='profile-form'>
    <ProfilePhotoField
      currentFile={userPhoto}
      setFile={setUserPhoto}
    />
    <TextInputField
      label='Username'
      value={username}
      onChange={setUsername}
      placeholder='Add a username'
      error={usernameError}
      name='username'
      autoComplete='username'
    />
    <TextAreaField
      label='About me'
      value={bio}
      onChange={setBio}
      placeholder='Something about me'
      rows={4}
    />
  </div>)
}

export default ProfileForm