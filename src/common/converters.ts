// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

type AllContentTypeWSpecial = (Models.BaseArticle.ContentElementV2 | Models.Message.BodyContentV1 | Common.Content.ModerationSpecial);

const MAX_LINE_LENGTH_BEFORE_TRUNCATE = 100;
const PREVIEW_LENGTH = 150;

export function convertContentToPlainText(content: AllContentTypeWSpecial[]): string {
  return content.reduce((acc: string, curr: AllContentTypeWSpecial) => {
    switch (curr.type) {
      case 'text':
      case 'link':
      case 'richTextLink':
        return acc + curr.value;
      case 'tag':
        return acc + "#" + curr.value;
      case 'ticker':
        return acc + "$" + curr.value;
      case 'mention':
        return acc + "@" + curr.alias || curr.userId;
      case 'newline':
        return acc + '\n';
      case 'header':
        return acc + convertContentToPlainText(curr.value);
      case 'articleImage':
        return acc;
      case 'articleEmbed':
        return acc;
    }
    return '';
  }, '');
}

export function convertContentToPreviewText(content: Models.BaseArticle.Content) {
  if (content.version === '1') return content.text.substring(0, PREVIEW_LENGTH);
  else return convertContentToPlainText(content.content).substring(0, PREVIEW_LENGTH);
}

export function truncateMessage(message: Models.Message.Message) {
  const newMessage = { ...message };
  let currentLineLength = 0;
  const newBody: Models.Message.Body = { version: message.body.version, content: [] };
  
  // Only works for ver 1
  for (const content of message.body.content) {
    if ('value' in content) {
      newBody.content.push({...content, value: content.value.substring(0, MAX_LINE_LENGTH_BEFORE_TRUNCATE - currentLineLength)});
      currentLineLength += content.value.length;
    } else if ('alias' in content) {
      newBody.content.push({...content, alias: content.alias?.substring(0, MAX_LINE_LENGTH_BEFORE_TRUNCATE - currentLineLength)});
      currentLineLength += content.alias?.length || 0;
    }

    if (currentLineLength >= MAX_LINE_LENGTH_BEFORE_TRUNCATE) break;
  }

  newMessage.body = newBody;
  return newMessage;
}