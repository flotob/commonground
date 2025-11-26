// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import RolesManagement from "components/templates/CommunityLobby/RolesManagement/RolesManagement";

import "./RoleManagementView.css";

type Props = {

}

export default function RoleManagementView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="role-management-view">
        <RolesManagement />
      </div>
    );
  } else {
    return (
      <div className="role-management-view">
        <Scrollable>
          <RolesManagement />
        </Scrollable>
      </div>
    );
  }
}