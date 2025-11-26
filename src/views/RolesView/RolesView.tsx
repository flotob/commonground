// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import RoleAssignmentList from 'components/organisms/RoleAssignmentList/RoleAssignmentList';
import Scrollable from 'components/molecules/Scrollable/Scrollable';

import './RolesView.css';

type Props = {
};

const RolesView: React.FC<Props> = () => {
  return (
    <div className="roles-view">
      <Scrollable>
        <RoleAssignmentList />
      </Scrollable>
    </div>
  );
}

export default React.memo(RolesView);