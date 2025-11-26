// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './CommunityInput.css';
import Jdenticon from 'components/atoms/Jdenticon/Jdenticon';
import React from 'react';
import { useOwnUser } from 'context/OwnDataProvider';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { useNavigate } from 'react-router';
import { getUrl } from 'common/util';

type Props = {};

const CommunityInput: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const ownUser = useOwnUser();
  const { community, communityPermissions } = useLoadedCommunityContext();

  const canViewItem = communityPermissions.has('COMMUNITY_MANAGE_ARTICLES');

  if (!canViewItem) return null;

  return <div className='community-input flex gap-4 p-2 items-center cursor-pointer cg-border-xl self-center' onClick={() => navigate(getUrl({ type: 'community-create-article', community }))}>
    {ownUser?.id && <Jdenticon
      userId={ownUser?.id}
      predefinedSize='40'
      hideStatus
    />}
    <div className='flex-1'>
      <span className='cg-text-lg-400 cg-text-main'>Post something...</span>
    </div>
  </div>;
  
}

export default React.memo(CommunityInput);