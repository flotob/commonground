// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal'
import { useOwnUser } from 'context/OwnDataProvider';
import React from 'react'

type Props = {
  requestedPermission: 'email' | 'twitter' | 'lukso' | 'farcaster' | 'friends' | null;
  setRequestedPermission: (permission: 'email' | 'twitter' | 'lukso' | 'farcaster' | 'friends' | null) => void;
  onAcceptPermission: (openAccountProvider: boolean) => void;
}

const AddPermissionModal: React.FC<Props> = ({ requestedPermission, setRequestedPermission, onAcceptPermission }) => {
  const ownUser = useOwnUser();
  const userHasAccount = (requestedPermission === 'email' && !!ownUser?.email && ownUser.emailVerified) || (ownUser?.accounts.some((account) => account.type === requestedPermission));

  const getContent = () => {
    const getAccountName = () => {
      switch (requestedPermission) {
        case 'email':
          return 'Email';
        case 'twitter':
          return 'X';
        case 'lukso':
          return 'LUKSO';
        case 'farcaster':
          return 'Farcaster';
        default:
          return '';
      }
    }

    if (requestedPermission === 'friends') {
      return <>
        <h3>This plugin is requesting access to your <span className='cg-text-brand'>Common Ground friends.</span></h3>
        <h4>Do you want allow this permission?</h4>
      </>;

    } else {
      return <>
        <h3>This plugin is requesting access to your <span className='cg-text-brand'>{getAccountName()} account.</span></h3>
        {!userHasAccount && <h4>Do you want to link this account to your Common Ground profile?</h4>}
        {userHasAccount && <h4>Do you want to allow this permission?</h4>}
      </>;
    }
  }

  return <ScreenAwareModal
    isOpen={!!requestedPermission}
    onClose={() => setRequestedPermission(null)}
    hideHeader
  >
    <div className="flex flex-col gap-4 p-4 cg-text-main">
      {getContent()}
      <div className='flex justify-end gap-2'>
        <Button
          role='borderless'
          text={'Cancel'}
          onClick={() => setRequestedPermission(null)}
        />
        <Button
          role='primary'
          text={'Accept and Continue'}
          onClick={() => onAcceptPermission(!userHasAccount && requestedPermission !== 'friends')}
        />
      </div>
    </div>
  </ScreenAwareModal>
}

export default React.memo(AddPermissionModal);
