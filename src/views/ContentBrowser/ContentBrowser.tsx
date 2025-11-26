// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import ArticleExplorer from "../../components/organisms/ArticleExplorer/ArticleExplorer";
import Scrollable, { ScrollableHandle } from "../../components/molecules/Scrollable/Scrollable";

import "./ContentBrowser.css";
import { useRef } from "react";

export default function ContentBrowser() {
  const scrollableRef = useRef<ScrollableHandle>(null);

  return (
    <Scrollable
      hideOnNoScroll={true}
      hideOnNoScrollDelay={600}
      autoScroll={false}
      className="content-browser-view"
      ref={scrollableRef}
    >
      <div className="content-browser-inner">
        <ArticleExplorer mode="unlimited" useLargeHeader onFinishedLoading={() => {
          scrollableRef.current?.lockScrollForNextUpdate({ type: 'expandingBottom' });
        }} />
      </div>
    </Scrollable>
  );
}