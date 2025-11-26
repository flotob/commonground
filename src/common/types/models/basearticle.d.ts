// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
  namespace BaseArticle {
    type ContentElementV2 =
      Common.Content.Text |
      Common.Content.Newline |
      Common.Content.Link |
      Common.Content.RichTextLink |
      Common.Content.Header |
      Common.Content.ArticleImage |
      Common.Content.ArticleEmbed;

    type ContentV1 = {
      version: '1';
      text: string;
    };
    type ContentV2 = {
      version: '2';
      content: ContentElementV2[];
    };
    type Content = ContentV1 | ContentV2;

    type Preview = {
      articleId: string;
      title: string;
      previewText: string | null; // max length = 150 in validator
      thumbnailImageId: string | null;
      headerImageId: string | null;
      creatorId: string;
      tags: string[];
      commentCount: number;
      latestCommentTimestamp: string | null; // ISO 8601 format, nullable
    };

    type DetailView = Preview & {
      content: Content;
      channelId: string;
    };
  }
}