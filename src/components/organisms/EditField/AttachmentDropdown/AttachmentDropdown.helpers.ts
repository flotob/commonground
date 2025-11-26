// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { InMemoryAttachment } from "../useAttachments/useAttachments";

export function addFiles(
  setAttachments: React.Dispatch<React.SetStateAction<InMemoryAttachment[]>>,
  setAttachmentError: (error: string) => void,
  files: File[],
  attachmentLimit: number
) {
  const newAttachments: InMemoryAttachment[] = files.map(file => ({ imageId: file.name, largeImageId: '', type: 'image', tentativeFile: file, state: 'INITIAL' }));
  setAttachments(oldAttachments => {
    const attachmentList = [...oldAttachments, ...newAttachments];
    if (attachmentList.length > attachmentLimit) {
      setAttachmentError(`Whoa there, only ${attachmentLimit} attachments allowed at once 😳`);
    }
    return attachmentList.slice(0, attachmentLimit);
  });
}
