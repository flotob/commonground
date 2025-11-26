// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Dexie, Table } from 'dexie';
import config from '../../common/config';

class ArticlesDexieDatabase extends Dexie {
  articles!: Table<any>;
  articlePreviews!: Table<any>;

  constructor() {
    super(`${config.IDB_PREFIX}_articles`);
    db.version(1).stores({
      articles: '&id,published,type,groupId,tags', // todo check how does work index for tags[]
      articlePreviews: '&id,published,type,groupId,tags'
    });
  }

  public async getStartPageListView(): Promise<any> {
    try {
      const articles = null; // = await db.articles.get();
      return articles;
    } catch (e) {
      throw new Error('cannot load articles');
    }
  }
}

const db = new ArticlesDexieDatabase();

export default db;