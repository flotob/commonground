// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import ContentSlider from 'components/molecules/ContentSlider/ContentSlider';
import { useOwnUser } from 'context/OwnDataProvider';
import userApi from 'data/api/user';
import React, { useCallback, useEffect, useState } from 'react'

type Props = {
  userId: string;
}

const USER_LOAD_LIMIT = 6;

const UserPosts: React.FC<Props> = (props) => {
  const { userId } = props;
  const ownUser = useOwnUser();
  const [loading, setLoading] = useState(true);
  const [doneLoading, setDoneLoading] = useState(false);
  const [articles, setArticles] = useState<API.User.getArticleList.Response>([]);
  const [showingDrafts, setShowingDrafts] = useState(false);
  const isSelf = ownUser?.id === userId;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const response = await userApi.getArticleList({
        userId: userId,
        limit: USER_LOAD_LIMIT,
        order: 'DESC',
        orderBy: 'updatedAt',
        drafts: showingDrafts ? true : undefined
      });
      setLoading(false);
      setArticles(response);
      if (response.length < USER_LOAD_LIMIT) {
        setDoneLoading(true);
      }
    }
    if (userId) fetch();
  }, [userId, showingDrafts]);

  const loadMore = useCallback(async () => {
    const lastItem = articles[articles.length - 1];
    if (!lastItem) {
      return;
    }

    setLoading(true);
    const response = await userApi.getArticleList({
      order: 'DESC',
      userId: userId,
      limit: USER_LOAD_LIMIT,
      orderBy: 'updatedAt',
      updatedBefore: lastItem.userArticle.updatedAt || new Date(0).toISOString(),
      drafts: showingDrafts ? true : undefined
    });
    setLoading(false);

    if (response.length < USER_LOAD_LIMIT) {
      setDoneLoading(true);
      return;
    }
    setArticles((prev) => [...prev, ...response]);
  }, [articles, userId, showingDrafts]);

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-4 cg-text-main'>
      <div className='flex justify-between items-center gap-4'>
      <h2>User Posts</h2>
      {isSelf && (
        <Button
          className='w-fit'
          role='secondary'
          active={showingDrafts}
          text={showingDrafts ? 'Hide Drafts' : 'Show Drafts'}
          onClick={() => setShowingDrafts(!showingDrafts)}
        />
      )}
      </div>
      <ContentSlider
        items={articles}
        isLoading={loading}
        onViewAllClick={loadMore}
        hideAuthors={true}
      />
      {!doneLoading && <Button
        className='w-fit'
        role='secondary'
        text='Load more'
        onClick={loadMore}
      />}
    </div>
  )
}

export default UserPosts