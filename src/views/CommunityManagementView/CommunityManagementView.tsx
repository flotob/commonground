// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import CommunityManagement from "../../components/templates/CommunityLobby/CommunityManagement/CommunityManagement"
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

import "./CommunityManagementView.css";

type Props = {

}

export default function CommunityManagementView(props: Props) {
  const { community } = useLoadedCommunityContext();
  const { isMobile } = useWindowSizeContext();

  if (!!community) {
    if (isMobile) {
      return <div className="community-management-view">
        <div className="community-management-view-inner">
          <CommunityManagement />
        </div>
      </div>
    } else {
      return (<div className="community-management-view">
        <Scrollable >
          <div className="community-management-view-inner">
            <CommunityManagement />
          </div>
        </Scrollable>
      </div>);
    }
  }

  return null;
}