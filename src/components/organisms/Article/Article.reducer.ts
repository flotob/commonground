// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export type ArticleViewDataState = {
    stateNode: 'LOADING' | 'IDLE';
    article?: API.Community.getArticleDetailView.Response;
    error?: string;
    moreArticles?: API.Community.getArticleList.Response;
}

type StartLoadingAction = {
    type: 'StartLoading';
};

type LoadArticleAction = {
    type: 'LoadArticle';
    article: API.Community.getArticleDetailView.Response;
}

type LoadMoreArticlesAction = {
    type: 'LoadMoreArticles',
    loadedArticles?: API.Community.getArticleList.Response;
}

type ShowErrorAction = {
    type: 'ShowError';
    error: string;
}

export type Action = StartLoadingAction | LoadArticleAction | LoadMoreArticlesAction | ShowErrorAction;

export const initialState: ArticleViewDataState = {
    stateNode: 'LOADING'
};

export function articleViewReducer(state: ArticleViewDataState, action: Action): ArticleViewDataState {
    switch (action.type) {
        case 'StartLoading':
            return {
                stateNode: 'LOADING'
            };
        case 'LoadArticle':
            return {
                ...state,
                stateNode: 'IDLE',
                article: action.article,
                error: undefined,
            };
        case 'LoadMoreArticles':
            return {
                ...state,
                moreArticles: action.loadedArticles
            }
        case 'ShowError':
            return {
                ...state,
                stateNode: 'IDLE',
                error: action.error
            };
        default:
            throw new Error('Invalid reducer action');
    }
};
