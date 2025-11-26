// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export type BlogViewDataState = {
    stateNode: 'LOADING' | 'IDLE';
    blog?: API.User.getArticleDetailView.Response;
    relatedBlogs?: API.User.getArticleList.Response;
    error?: string;
}

type StartLoadingAction = {
    type: 'StartLoading';
};

type LoadBlogAction = {
    type: 'LoadBlog';
    blog: API.User.getArticleDetailView.Response;
}

type LoadRelatedBlogsAction = {
    type: 'LoadRelatedBlogs';
    relatedBlogs: API.User.getArticleList.Response;
}

type ShowErrorAction = {
    type: 'ShowError';
    error: string;
}

export type Action = StartLoadingAction | LoadBlogAction | LoadRelatedBlogsAction | ShowErrorAction;

export const initialState: BlogViewDataState = {
    stateNode: 'LOADING'
};

export function blogViewReducer(state: BlogViewDataState, action: Action): BlogViewDataState {
    switch (action.type) {
        case 'StartLoading':
            return {
                ...state,
                stateNode: 'LOADING'
            };
        case 'LoadBlog':
            return {
                ...state,
                stateNode: 'IDLE',
                blog: action.blog,
                error: undefined,
            };
        case 'LoadRelatedBlogs':
            return {
                ...state,
                relatedBlogs: action.relatedBlogs
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
