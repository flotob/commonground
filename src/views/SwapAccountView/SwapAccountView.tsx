// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useNavigate } from "react-router-dom";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import Scrollable from "../../components/molecules/Scrollable/Scrollable";
import SwapAccount from "../../components/organisms/SwapAccount/SwapAccount";

import './SwapAccountView.css';
import { getUrl } from 'common/util';
import { useOwnUser } from "context/OwnDataProvider";

export default function SwapAccountView() {
  const { isMobile } = useWindowSizeContext();
  const ownUser = useOwnUser();
  const navigate = useNavigate();

  if (!isMobile) {
    // desktop version is available under appropriate modal dialog of profile view
    if (ownUser) {
      navigate(getUrl({ type: 'user', user: ownUser }));
    } else {
      // if no user is available, redirect to home
      navigate(getUrl({ type: 'home' }));
    }
  }

  return (
    <div className="swap-account-view">
      <Scrollable>
        <SwapAccount />
      </Scrollable>
    </div>
  );
}