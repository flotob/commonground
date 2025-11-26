// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import ArticleExplorer from '../ArticleExplorer/ArticleExplorer';

import './ArticleList.css';

type Props = {
  loadingAmount?: number;
}

function ArticleList(props: Props) {
  return (
    <div className='article-list'>
      <ArticleExplorer mode="limited" onFinishedLoading={undefined} loadingAmount={props.loadingAmount} />
    </div>
  )
}

export default React.memo(ArticleList);