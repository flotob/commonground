// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useRef } from "react";

import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import CommunityExplorer from "../../components/organisms/CommunityExplorer/CommunityExplorer";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

import './GroupBrowser.css';

export default function GroupBrowser() {
  const { isMobile } = useWindowSizeContext();
  const scrollableRef = useRef<React.ElementRef<typeof Scrollable>>(null);

  return (
    <Scrollable
      innerClassName={isMobile ? 'community-browser-view-mobile' : 'community-browser-view'}
      ref={scrollableRef}
    >
      <div className="group-browser-content">
        <CommunityExplorer mode="unlimited" useLargeHeader />
      </div>
    </Scrollable>
  );
}