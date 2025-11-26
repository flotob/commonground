// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import BlogExplorer from '../BlogExplorer/BlogExplorer';

import './BlogList.css';

type Props = {
  loadingAmount?: number;
}

function BlogList(props: Props) {
  return (
    <div className='blog-list'>
      <BlogExplorer mode="limited" onFinishedLoading={undefined} loadingAmount={props.loadingAmount} />
    </div>
  )
}

export default React.memo(BlogList);