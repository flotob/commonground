// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Editor, Node, Transforms } from "slate";
import { EmbedElement } from "../EditField.helpers";

function getYoutubeEmbedId(url: string) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
}

export const validateAndSetEmbedId = (editor: Editor, url: string, id: string) => {
  const embedId = getYoutubeEmbedId(url);
  if (embedId) {
    Transforms.setNodes(editor, { embedId }, {
      match: matchEmbedNodeRule(id),
      at: []
    });
  } else {
    return 'Not a valid youtube link';
  }
}

export const matchEmbedNodeRule = (targetId: string) => (node: Node) => {
  const nodeTyped = node as EmbedElement;
  return nodeTyped.type === 'embed' && nodeTyped.id === targetId;
}