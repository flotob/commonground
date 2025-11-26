// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import './MessageAttachments.css';
import FullscreenImageModal from '../../../../components/atoms/FullscreenImageModal/FullscreenImageModal';
import { useSignedUrl } from '../../../../hooks/useSignedUrl';
import ExternalLinkPreview from 'components/molecules/LinkPreview/LinkPreview';
import { useAsyncMemo } from 'hooks/useAsyncMemo';
import { gf } from 'util/giphy';
import { IGif } from '@giphy/js-types';

type Props = {
  attachments: Models.Message.Attachment[];
  setImageModalOpen: (isOpen: boolean) => void;
}

const MessageAttachments: React.FC<Props> = ({ attachments, setImageModalOpen }) => {
  const [selectedIndex, _setSelectedIndex] = React.useState<number | undefined>();
  const giphyGifs = useAsyncMemo(async () => {
    const giphyIds = attachments.map(att => att.type === 'giphy' ? att.gifId : undefined).filter(id => !!id) as string[];
    const response = await gf.gifs(giphyIds);
    return response.data;
  }, [attachments]);

  const setSelectedIndex: React.Dispatch<React.SetStateAction<number | undefined>> = React.useCallback((newIndex) => {
    _setSelectedIndex(newIndex);
    setImageModalOpen(newIndex !== undefined)
  }, [setImageModalOpen]);

  const renderAttachment = (attachment: Models.Message.Attachment, index: number) => {
    if (attachment.type === 'image') {
      return <ImageAttachment
        key={`${index}-${attachment.imageId}`}
        thumbnailId={attachment.imageId}
        onClick={() => setSelectedIndex(index)}
        imageData={attachment.imageData}
      />;
    } else if (attachment.type === 'linkPreview') {
      return <ExternalLinkPreview
        key={`${index}-${attachment.url}`}
        title={attachment.title}
        description={attachment.description}
        imageId={attachment.imageId}
        imageData={attachment.imageData}
        url={attachment.url}
      />;
    } else if (attachment.type === 'giphy') {
      const gif = giphyGifs?.find(gif => gif.id === attachment.gifId);
      return <GiphyAttachment
        key={`${index}-${attachment.gifId}`}
        gif={gif}
        onClick={() => setSelectedIndex(index)}
        attachmentData={attachment}
      />
      return null;
    }

    return <>Attachment unsupported</>;
  };

  const linkPreviewAttachments = attachments.filter(function (att): att is Models.Message.LinkPreviewAttachment { return att.type === 'linkPreview' });
  const imageAttachments = attachments.filter(function (att) { return att.type === 'image' || att.type === 'giphy' });
  return <div className='messageAttachments'>
    <FullscreenImageModal
      open={selectedIndex !== undefined}
      images={imageAttachments.map(att => {
        if (att.type === 'image') return { id: att.largeImageId };
        else if (att.type === 'giphy') {
          const gif = giphyGifs?.find(gif => gif.id === att.gifId);
          return { url: gif?.images.original.url }
        }
        return { id: '' }
      })}
      close={() => setSelectedIndex(undefined)}
      selectedIndex={selectedIndex}
    />
    {linkPreviewAttachments.map(renderAttachment)}
    {imageAttachments.length > 0 && <div className='messageAttachmentImages'>
      {imageAttachments.map(renderAttachment)}
    </div>}
  </div>;
}

const calculateTargetWidth = ({ actualWidth, actualHeight, targetHeight }: { actualWidth: number, actualHeight: number, targetHeight: number }) => {
  if (actualHeight === 0) return 150; // div by zero, fall back to 150px
  return Math.round(actualWidth * targetHeight / actualHeight);
}

type ImageAttachmentProps = {
  onClick: () => void;
  thumbnailId: string;
  imageData?: Common.ImageMetadata;
}

const ImageAttachment: React.FC<ImageAttachmentProps> = React.memo((props) => {
  const imageUrl = useSignedUrl(props.thumbnailId);
  let targetWidth: number | undefined;
  if (props.imageData) {
    targetWidth = calculateTargetWidth({
      actualWidth: props.imageData.size.width,
      actualHeight: props.imageData.size.height,
      targetHeight: 150
    });
  }

  return (
    <div className="messageAttachmentImageContainer">
      <img
        loading='lazy'
        className={`messageAttachmentImage`}
        onLoad={function (ev) { ev.currentTarget.style.opacity = '1'; ev.currentTarget.style.transform = 'scale(1)'; }}
        src={imageUrl}
        alt=""
        onClick={props.onClick}
        width={targetWidth !== undefined ? `${targetWidth}px` : undefined}
        height={`150px`}
      />
    </div>
  );
});

type GiphyAttachmentProps = {
  onClick: () => void;
  gif?: IGif;
  attachmentData: Models.Message.Attachment & { type: "giphy" };
}

const GiphyAttachment: React.FC<GiphyAttachmentProps> = React.memo((props) => {
  
  if (props.gif) {
    const imageUrl = props.gif.images.fixed_height.url;
    const targetWidth = calculateTargetWidth({
      actualWidth: props.gif.images.fixed_height.width,
      actualHeight: props.gif.images.fixed_height.height,
      targetHeight: 150
    });

    return (
      <div className="messageAttachmentImageContainer">
        <img
          loading='lazy'
          className={`messageAttachmentImage`}
          onLoad={function (ev) { ev.currentTarget.style.opacity = '1'; ev.currentTarget.style.transform = 'scale(1)'; }}
          src={imageUrl}
          alt=''
          onClick={props.onClick}
          width={targetWidth !== undefined ? `${targetWidth}px` : undefined}
          height={`150px`}
        />
      </div>
    );
  }
  else {
    const targetWidth = calculateTargetWidth({
      actualWidth: props.attachmentData.previewWidth || 200,
      actualHeight: props.attachmentData.previewHeight || 200,
      targetHeight: 150
    });
    return (
      <div className="messageAttachmentImageContainer">
        <div
          className={`messageAttachmentImage`}
          data-info="placeholder"
          onClick={props.onClick}
          style={{
            width: targetWidth !== undefined ? `${targetWidth}px` : undefined,
            height: `150px`,
          }}
        />
      </div>
    )
  }
});

export default React.memo(MessageAttachments);