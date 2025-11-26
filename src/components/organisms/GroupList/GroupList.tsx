// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import CommunityExplorer from '../CommunityExplorer/CommunityExplorer';

import './GroupList.css';

type Props = {
  loadingAmount: number;
};

function GroupList(props: Props) {

  return (
    <div className='groupList'>
      <CommunityExplorer mode='limited' loadingAmount={props.loadingAmount} />
    </div>
  )
}

export default React.memo(GroupList);