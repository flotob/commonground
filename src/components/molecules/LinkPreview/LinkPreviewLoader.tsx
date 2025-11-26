// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import { fetchLinkPreview } from 'components/organisms/EditField/useAttachments/useAttachments';
import { useAsyncMemo } from 'hooks/useAsyncMemo';
import ExternalLinkPreview from './LinkPreview';

type Props = {
  url: string;
}

const LinkPreviewLoader: React.FC<Props> = ({ url }) => {
  const attachmentInfo = useAsyncMemo(() => fetchLinkPreview(url), [url]);

  if (attachmentInfo?.type === 'linkPreview') {
    return (<ExternalLinkPreview {...attachmentInfo}/>);
  } else {
    return null;
  }
}

export default React.memo(LinkPreviewLoader);