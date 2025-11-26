// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import "./TokenSettingsView.css";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import TokenManagement from "components/templates/CommunityLobby/TokenManagement/TokenManagement";

type Props = {

}

export default function TokenSettingsView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="token-settings-view">
        <TokenManagement />
      </div>
    );
  } else {
    return (
      <div className="token-settings-view">
        <Scrollable>
          <TokenManagement />
        </Scrollable>
      </div>
    );
  }
}