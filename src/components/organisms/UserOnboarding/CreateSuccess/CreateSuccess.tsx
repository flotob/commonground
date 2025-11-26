// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect, useState } from 'react'
import Button from 'components/atoms/Button/Button';
import ArticleCard from 'components/molecules/ArticleCardV2/ArticleCardV2';
import SimpleLink from 'components/atoms/SimpleLink/SimpleLink';
import communityArticleManager from 'data/managers/communityArticleManager';
import config from 'common/config';
import OnboardingLogo from '../OnboardingLogo';
import { Spinner } from '@phosphor-icons/react';

type Props = {
  onClose: () => void;
};

const CreateSuccess: React.FC<Props> = (props) => {
  const { onClose } = props;

  const [articles, setArticles] = useState<API.Community.getArticleDetailView.Response[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const getStarted = await communityArticleManager.getArticle({
        communityId: config.DEPLOYMENT === 'prod' ? 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7' : 'da5ea60a-9182-4499-81a5-f8b680e62672',
        articleId: '4cab7f68-0e02-466c-94a8-4d95e22d117c',
      });
      const faq = await communityArticleManager.getArticle({
        communityId: config.DEPLOYMENT === 'prod' ? 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7' : 'da5ea60a-9182-4499-81a5-f8b680e62672',
        articleId: '85434c4a-cf9d-4832-9cbc-74909f9e6ad5',
      });
      const articles = [getStarted, faq];
      setArticles(articles);
    }

    fetchArticles();
  }, []);

  return (<div className='flex flex-col py-8 px-4 items-center justify-between min-h-full gap-6'>
    <div className='flex flex-col items-center justify-center gap-2'>
      <OnboardingLogo />
      <span className='cg-heading-1 max-w-xs text-center'>Welcome to Common Ground 🥳</span>
      <span className='cg-text-lg-400 text-center'>Feel free to join any community and say hello. Not sure where to start? We wrote some guides to help 🪴</span>
    </div>
    <div className='flex-1 flex flex-col gap-2 items-center'>
      {articles.length === 0 && <div className='flex w-full items-center justify-center'>
        <Spinner className="spinner" />
      </div>}
      {articles.map(article => <div onClick={onClose} key={article.article.articleId}>
        <ArticleCard
          article={article}
          hideAuthor
        />
      </div>)}
      <span className='cg-text-lg-500 text-center'>And don’t forget to check out the <SimpleLink className='underline' inlineLink href='https://app.cg/c/commonground/'>Common Ground</SimpleLink> community and say hi!</span>
    </div>
    <div className='flex flex-col gap-2 items-center max-w-xs w-full'>
      <Button
        text='Finish'
        className='w-full'
        role='primary'
        onClick={onClose}
      />
    </div>
  </div>);
}

export default CreateSuccess;