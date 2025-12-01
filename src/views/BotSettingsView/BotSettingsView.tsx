// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./BotSettingsView.css";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import BotsManagement from "components/templates/CommunityLobby/BotsManagement/BotsManagement";

type Props = {};

export default function BotSettingsView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="bot-settings-view">
        <BotsManagement />
      </div>
    );
  } else {
    return (
      <div className="bot-settings-view">
        <Scrollable>
          <BotsManagement />
        </Scrollable>
      </div>
    );
  }
}

