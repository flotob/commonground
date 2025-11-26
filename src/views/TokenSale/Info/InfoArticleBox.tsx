// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { SquareHalf } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import { AllContentRenderer } from 'components/molecules/MesssageBodyRenderer/MessageBodyRenderer';
import { useSidebarDataDisplayContext } from 'context/SidebarDataDisplayProvider';
import communityArticleManager from 'data/managers/communityArticleManager';
import { useSignedUrl } from 'hooks/useSignedUrl';
import React from 'react';

type Props = {
  communityId: string;
  articleId: string;
  buttonText: string;

  backgroundColor: string;
  titleColor: string;
};

const InfoArticleBox: React.FC<Props> = ({ communityId, articleId, buttonText, backgroundColor, titleColor }) => {
  const { showTooltip } = useSidebarDataDisplayContext();
  const [article, setArticle] = React.useState<API.Community.getArticleDetailView.Response | null>(null);
  const imageUrl = useSignedUrl(article?.article?.headerImageId);

  // Fetch article and display correct data
  React.useEffect(() => {
    const fetchArticle = async (communityId: string, articleId: string) => {
      try {
        const article = await communityArticleManager.getArticle({ communityId, articleId });

        if (article) {
          setArticle(article);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (communityId && articleId) {
      fetchArticle(communityId, articleId);
    }
  }, [communityId, articleId]);

  const openArticle = React.useCallback(() => {
    showTooltip({ type: 'article', articleId, communityId });
  }, [showTooltip, articleId, communityId]);

  if (!article) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pt-4 px-4 relative tokensale-info-article-box cg-text-main overflow-hidden cursor-pointer" style={{ backgroundColor }} onClick={openArticle}>
      <img className='tokensale-info-article-box-image' src={imageUrl} alt='Header' />

      <div className="flex items-center gap-2">
        <h2 style={{ color: titleColor }}>{article?.article?.title}</h2>
      </div>

      {article?.article?.content.version === '2' && <div className='flex-1 overflow-hidden article-box-content cg-text-secondary'>
        <AllContentRenderer content={article?.article?.content.content} />
      </div>}

      <div className="tokensale-info-article-box-button absolute p-5 bottom-0 left-0 right-0 flex items-center justify-center">
        <Button
          text={buttonText}
          iconRight={<SquareHalf weight="duotone" className="w-5 h-5" />}
          className="tokensale-floating-button"
          role="secondary"
        />
      </div>
    </div>
  );
};

export default InfoArticleBox;
