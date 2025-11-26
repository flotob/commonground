// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import "./OnboardingManagementView.css";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import OnboardingManagement from "components/templates/CommunityLobby/OnboardingManagement/OnboardingManagement";

type Props = {

}

export default function OnboardingManagementView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="onboarding-management-view">
        <OnboardingManagement />
      </div>
    );
  } else {
    return (
      <div className="onboarding-management-view">
        <Scrollable>
          <OnboardingManagement />
        </Scrollable>
      </div>
    );
  }
}