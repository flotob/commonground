// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useRef, useState } from "react";

import BlogExplorer from "../../components/organisms/BlogExplorer/BlogExplorer";
import Breadcrumbs from "../../components/atoms/Breadcrumbs/Breadcrumbs";
import Scrollable, { PositionData } from "../../components/molecules/Scrollable/Scrollable";

import "./BlogBrowser.css";

export default function BlogBrowser() {
  const [loadMore, setLoadMore] = useState(false);
  const scrollableRef = useRef<React.ElementRef<typeof Scrollable>>(null);

  const positionCallback = useCallback((data: PositionData) => {
    if (data.isBottom && !loadMore) {
      setLoadMore(true);
    }
  }, [loadMore]);

  const onFinishedLoading = useCallback(() => {
      setLoadMore(false);
  }, []);

  return (
    <Scrollable
      hideOnNoScroll={true}
      hideOnNoScrollDelay={600}
      autoScroll={true}
      ref={scrollableRef}
      positionCallback={positionCallback}
      className="blog-browser-view"
    >
      <div className="blog-browser-inner">
        <BlogExplorer mode="unlimited" loadMore={loadMore} onFinishedLoading={onFinishedLoading} gridOnMobile />
      </div>
    </Scrollable>
  );
}