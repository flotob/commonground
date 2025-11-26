// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useOwnUser } from 'context/OwnDataProvider';
import userApi from 'data/api/user';
import React, { useEffect } from 'react'

const isInPWA = window.matchMedia('(display-mode: standalone)').matches;

const UserInfoManager = () => {
  const ownUser = useOwnUser();

  // Set the pwa flag
  useEffect(() => {
    if (!ownUser?.extraData.installedPWA && isInPWA) {
      userApi.setOwnExtraDataField({key: 'installedPWA', value: true});
    }
  }, [ownUser?.extraData.installedPWA]);

  return null;
}

export default React.memo(UserInfoManager);