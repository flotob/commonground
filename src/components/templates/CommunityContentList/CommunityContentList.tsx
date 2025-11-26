// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ContentSlider from 'components/molecules/ContentSlider/ContentSlider';
import Scrollable, { PositionData } from 'components/molecules/Scrollable/Scrollable';

import './CommunityContentList.css';
import { useLiveQuery } from 'dexie-react-hooks';
import data from 'data';
import communityArticleManager from 'data/managers/communityArticleManager';

type Props = {
  communityId: string;
  tags: Models.BaseArticle.Preview["tags"];
  positionCallback?: (direction: 'up' | 'down') => void;
}

const MIN_SCROLL_DELTA = 20;

const CommunityContentList: React.FC<Props> = (props) => {
  const {
    positionCallback: propsPositionCallback,
    communityId,
    tags
  } = props;

  // TODO: should watch database loading state
  // const onFinishedLoading = useCallback(() => setLoadMore(false), []);
  const [isLoading, setIsLoading] = useState(true);

  const [loadMore, setLoadMore] = useState(false);
  const scrollY = useRef(0);

  // Todo: drafts?
  /*
  const loadDrafts = contentType === 'draft';
  const showSubtitle = loadDrafts;
  */
  const title = tags.join(', ');

  // Initial load
  const items = useLiveQuery(async () => {
    const articles = await communityArticleManager.getArticleList({
      communityId,
      limit: 20,
      tags
    });
    setIsLoading(false);
    return articles;
  });

  // FIXME: Please refactor this when possible
  const positionCallback = useCallback((data: PositionData) => {
    if (propsPositionCallback) {
        if (data.isTop) {
            propsPositionCallback('up');
        } else if (data.isBottom) {
            propsPositionCallback('down');
        } else {
            const lastY = scrollY.current;
            const currDiff = lastY - data.scrollTop;
            if (Math.abs(currDiff) >= MIN_SCROLL_DELTA) {
                propsPositionCallback(currDiff > 0 ? 'up' : 'down');
                scrollY.current = data.scrollTop;
            }
        }
    }

    if (data.isBottom && loadMore === false && !!items && items?.length > 0) {
      setLoadMore(true);
    }
  }, [items, loadMore, propsPositionCallback]);

  return (
    <Scrollable positionCallback={positionCallback} >
      <div className='community-content'>
        <div className='community-content-list'>
          <span className='community-content-list-title'>
            {title}
            {/* Todo! showSubtitle && <span className='community-content-list-subtitle'>
              This page is only visible to users who have the right permissions
            </span>*/}
          </span>
          {/* FIXME: Fetch and pass the correct items here */}
          <ContentSlider items={[]} hideAuthors loadingAmount={6} isLoading={isLoading} />
        </div>
      </div>
    </Scrollable>
  );
}

export default CommunityContentList