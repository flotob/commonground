// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import "./PluginSettingsView.css";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import PluginsManagement from "components/templates/CommunityLobby/PluginsManagement/PluginsManagement";

type Props = {

}

export default function PluginSettingsView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="plugin-settings-view">
        <PluginsManagement />
      </div>
    );
  } else {
    return (
      <div className="plugin-settings-view">
        <Scrollable>
          <PluginsManagement />
        </Scrollable>
      </div>
    );
  }
}