// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Search {
            namespace searchUsers {
                type Request = {
                    query: string | null;
                    limit?: number;
                    offset?: number;
                    tags?: string[];
                };
                type Response = {
                    id: string;
                    matchPriority?: number;
                    matchedAccountTypes?: Models.User.ProfileItemType[];
                }[];
            }

            namespace searchArticles {
                type Request = {
                    type: 'community' | 'user' | 'all';
                    query: string | null;
                    limit?: number;
                    offset?: number;
                    tags?: string[];
                };
                type Response = (API.Community.getArticleList.Response[number] | API.User.getArticleList.Response[number])[];
            }
        }
    }
}

export { }