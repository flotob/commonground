// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import userArticleManager from "data/managers/userArticleManager";

type LoadingState = 'INITIALIZING' | 'IDLE' | 'LOADING' | 'DONE';
type ContentType = 'draft' | 'blog' | 'following';

type BlogDataState = {
    state: LoadingState;
    draftState: LoadingState;
    followingState: LoadingState;
    blogs: API.User.getArticleList.Response;
    drafts: API.User.getArticleList.Response;
    followings: API.User.getArticleList.Response;
    userId?: string;
};

type StartLoadingAction = {
    type: 'StartLoading';
    contentType: ContentType;
}

type FetchContentAction = {
    type: 'FetchContent';
    blogs: API.User.getArticleList.Response;
    following: API.User.getArticleList.Response;
    drafts: API.User.getArticleList.Response;
    userId?: string;
}

type AppendUserBlogsAction = {
    type: 'AppendUserBlogs';
    blogs: API.User.getArticleList.Response;
};

type AppendFollowingAction = {
    type: 'AppendFollowing';
    following: API.User.getArticleList.Response;
};

type AppendDraftsAction = {
    type: 'AppendDrafts';
    drafts: API.User.getArticleList.Response;
};

type AppendAllBlogsAction = {
    type: 'AppendAllBlogs';
    all: API.User.getArticleList.Response;
};

type ResetUserAction = {
    type: 'ResetUser'
    userId?: string;
}

type Action = StartLoadingAction | FetchContentAction | AppendUserBlogsAction | AppendDraftsAction | AppendAllBlogsAction | AppendFollowingAction | ResetUserAction;

export const initialState: BlogDataState = {
    state: 'INITIALIZING',
    draftState: 'INITIALIZING',
    followingState: 'INITIALIZING',
    blogs: [],
    drafts: [],
    followings: [],
    userId: undefined
};

export function blogsReducer(state: BlogDataState, action: Action): BlogDataState {
    switch (action.type) {
        case 'StartLoading': {
            const newState = {...state};
            switch (action.contentType){
                case 'blog':
                    newState.state = 'LOADING';
                    break;
                case 'draft':
                    newState.draftState = 'LOADING';
                    break;
                case 'following':
                    newState.followingState = 'LOADING';
                    break;
            } 
            return newState;
        } case 'FetchContent':
            if (action.userId && state.userId !== action.userId) {
                return state;
            }
            return {
                ...state,
                blogs: action.blogs,
                drafts: action.drafts,
                followings: action.following,
                state: action.blogs.length > 0 ? 'IDLE' : 'DONE',
                draftState: action.drafts.length > 0 ? 'IDLE' : 'DONE',
                followingState: action.following.length > 0 ? 'IDLE' : 'DONE',
            };
        case 'AppendUserBlogs': {
            // Filter repeats
            const newElements = action.blogs.filter(newElement => !state.blogs.find(blog => blog.article.articleId === newElement.article.articleId));

            return {
                ...state,
                blogs: [...state.blogs, ...newElements],
                state: action.blogs.length > 0 ? 'IDLE' : 'DONE'
            };
        } case 'AppendFollowing': {
            // Filter repeats
            const newElements = action.following.filter(newElement => !state.followings.find(blog => blog.article.articleId === newElement.article.articleId));

            return {
                ...state,
                followings: [...state.followings, ...newElements],
                followingState: action.following.length > 0 ? 'IDLE' : 'DONE'
            }
        } case 'AppendDrafts': {
            // Filter repeats
            const newElements = action.drafts.filter(newElement => !state.drafts.find(blog => blog.article.articleId === newElement.article.articleId));
            
            return {
                ...state,
                drafts: [...state.drafts, ...newElements],
                state: action.drafts.length > 0 ? 'IDLE' : 'DONE'
            };
        } case 'ResetUser':
            return {
                blogs: [],
                drafts: [],
                followings: [],
                state: 'LOADING',
                draftState: 'LOADING',
                followingState: 'LOADING',
                userId: action.userId
            }
        default:
            throw new Error('Invalid reducer action');
    }
};

export const fetchFrontpageContent = async (dispatch: React.Dispatch<Action>, limit: number) => {
    let blogs: API.User.getArticleList.Response = [];
    let following: API.User.getArticleList.Response = [];

    blogs = await userArticleManager.getArticleList({
        limit,
        order: 'DESC',
        verification: 'verified',
    });

    try {
        following = await userArticleManager.getArticleList({
            limit,
            order: 'DESC',
            followingOnly: true,
        });
    } catch (e) {
        // User is not logged in probably
    }

    dispatch({
        type: 'FetchContent',
        blogs,
        following,
        drafts: [],
    });
}

export const loadMoreContent = async (
    contentType: ContentType,
    dataState: BlogDataState,
    dispatch: React.Dispatch<Action>,
    onFinishedLoading?: () => void,
    userId?: string,
    includeUnverified?: boolean
) => {
    if (contentType === 'draft') {
        dispatch({ type: 'StartLoading', contentType: 'draft' });
        const lastItem = dataState.drafts[dataState.drafts.length - 1];

        const drafts = await userArticleManager.getArticleList({
            limit: 30,
            order: 'DESC',
            drafts: true,
            orderBy: 'updatedAt',
            updatedBefore: lastItem?.userArticle.updatedAt || new Date().toISOString(),
            userId
        });

        onFinishedLoading?.();

        dispatch({
            type: 'AppendDrafts',
            drafts
        });
    } else if (contentType === 'blog') {
        dispatch({ type: 'StartLoading', contentType: 'blog' });
        const lastItem = dataState.blogs[dataState.blogs.length - 1];

        const blogs = await userArticleManager.getArticleList({
            limit: 30,
            order: 'DESC',
            verification: includeUnverified ? 'both' : 'verified',
            publishedBefore: lastItem?.userArticle.published || new Date().toISOString(),
            userId
        });

        onFinishedLoading?.();

        dispatch({
            type: 'AppendUserBlogs',
            blogs
        });
    } else {
        dispatch({ type: 'StartLoading', contentType: 'following' });
        const lastItem = dataState.followings[dataState.followings.length - 1];

        const followings = await userArticleManager.getArticleList({
            limit: 30,
            order: 'DESC',
            followingOnly: true,
            publishedBefore: lastItem.userArticle.published || new Date().toISOString(),
        });

        onFinishedLoading?.();

        dispatch({
            type: 'AppendFollowing',
            following: followings
        });
    }
}