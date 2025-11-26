// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import PremiumManagement from "components/templates/CommunityLobby/PremiumManagement/PremiumManagement";

import "./SafeAndUpgradesView.css";

type Props = {

}

export default function SafeAndUpgradesView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="safe-and-upgrades-view">
        <PremiumManagement />
      </div>
    );
  } else {
    return (
      <div className="safe-and-upgrades-view">
        <Scrollable>
          <PremiumManagement />
        </Scrollable>
      </div>
    );
  }
}