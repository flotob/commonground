// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import dayjs from "dayjs";
import React from "react";
import communityArticleManager from "data/managers/communityArticleManager";

// import updateLocale from 'dayjs/plugin/updateLocale';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
// dayjs.extend(updateLocale);

export type LoadingState = 'INITIALIZING' | 'FROM_CACHE' | 'IDLE' | 'LOADING' | 'DONE';

export type CommunityHomeDataState = {
    state: LoadingState;
    content: API.Community.getArticleList.Response;
    communityId: string;
    draftState: LoadingState;
    drafts: API.Community.getArticleList.Response;
};

type StartLoadingAction = {
    type: 'StartLoading';
}

type StartLoadingDraftAction = {
    type: 'StartLoadingDraft';
}

type FetchCommunityContentAction = {
    type: 'FetchCommunityContent';
    content: API.Community.getArticleList.Response;
    currentCommunityId?: string;
    drafts: API.Community.getArticleList.Response;
}

type ResetFrontpageAction = {
    type: 'ResetFrontpage',
}

type ResetCommunityAction = {
    type: 'ResetCommunity',
    communityId: string;
}

type AppendCommunityContentAction = {
    type: 'AppendCommunityContent';
    content: API.Community.getArticleList.Response;
};

type AppendCommunityDraftsAction = {
    type: 'AppendCommunityDrafts';
    drafts: API.Community.getArticleList.Response;
};

type Action = StartLoadingAction | StartLoadingDraftAction | FetchCommunityContentAction | AppendCommunityContentAction | AppendCommunityDraftsAction | ResetCommunityAction | ResetFrontpageAction;

export const initialState: CommunityHomeDataState = {
    communityId: '',
    state: 'INITIALIZING',
    draftState: 'INITIALIZING',
    content: [],
    drafts: []
};

const initialStateCacheMap = new Map<string, CommunityHomeDataState>();
export function getInitialStateTryCache(id: string): CommunityHomeDataState {
    const fromCache = initialStateCacheMap.get(id);
    if (fromCache) {
        return {
            ...fromCache,
            state: 'FROM_CACHE',
            draftState: 'FROM_CACHE',
        };
    }
    return initialState;
}

export function communityHomeReducer(state: CommunityHomeDataState, action: Action): CommunityHomeDataState {
    switch (action.type) {
        case 'StartLoading':
            return {
                ...state,
                state: 'LOADING',
            };
        case 'StartLoadingDraft':
            return {
                ...state,
                draftState: 'LOADING',
            };
        case 'AppendCommunityContent': {
            // Filter repeats
            const newElements = action.content.filter(newElement => !state.content.find(article => article.article.articleId === newElement.article.articleId));

            return {
                ...state,
                state: action.content.length > 0 ? 'IDLE' : 'DONE',
                content: [...state.content, ...newElements]
            };
        } case 'AppendCommunityDrafts': {
            // Filter repeats
            const newElements = action.drafts.filter(newElement => !state.drafts.find(draft => draft.article.articleId === newElement.article.articleId));

            return {
                ...state,
                draftState: action.drafts.length > 0 ? 'IDLE' : 'DONE',
                drafts: [...state.drafts, ...newElements]
            };
        } case 'FetchCommunityContent':
            if (action.currentCommunityId && state.communityId !== action.currentCommunityId) {
                return state;
            }
            const result = {
                ...state,
                state: (action.content.length > 0 ? 'IDLE' : 'DONE') as LoadingState,
                content: action.content,
                draftState: (action.drafts.length > 0 ? 'IDLE' : 'DONE') as LoadingState,
                drafts: action.drafts,
            };
            initialStateCacheMap.set(result.communityId, result);
            return result;
        case 'ResetCommunity':
            return {
                content: state.state === 'FROM_CACHE' ? state.content : [],
                drafts: state.draftState === 'FROM_CACHE' ? state.drafts : [],
                state: 'LOADING',
                draftState: 'LOADING',
                communityId: action.communityId
            };
        case 'ResetFrontpage':
            return {
                ...state,
                content: [],
                drafts: [],
                state: 'LOADING',
                draftState: 'LOADING',
            }
        default:
            throw new Error('Invalid reducer action');
    }
};

export const fetchCommunityContent = async (communityId: string, isAllContentAvailable: boolean, dispatch: React.Dispatch<Action>, limit: number) => {
    dispatch({
        type: 'ResetCommunity',
        communityId
    });

    const contentItems = await communityArticleManager.getArticleList({
        limit,
        communityId,
        order: 'DESC',
    });

    let drafts: API.Community.getArticleList.Response = [];
    if (isAllContentAvailable) {
        drafts = await communityArticleManager.getArticleList({
            drafts: true,
            limit,
            communityId,
            order: 'DESC',
            orderBy: 'updatedAt',
        });
    }

    dispatch({
        type: 'FetchCommunityContent',
        content: contentItems,
        currentCommunityId: communityId,
        drafts
    });
}

export const fetchFrontpageContent = async (dispatch: React.Dispatch<Action>, limit: number, tags: string[] | undefined, following: boolean) => {
    const contentItems = await communityArticleManager.getArticleList({
        limit,
        verification: following ? 'following' : "verified",
        order: 'DESC',
        anyTags: tags,
    });
    dispatch({
        type: 'FetchCommunityContent',
        content: contentItems,
        drafts: []
    });
}

export const loadMoreContent = async (contentType: "all" | "draft", dataState: CommunityHomeDataState, dispatch: React.Dispatch<Action>, onFinishedLoading?: () => void, options?: { communityId?: string; anyTags?: string[]; tags?: string[]; following: boolean; }) => {
    if (contentType === "draft") {
        dispatch({
            type: 'StartLoadingDraft',
        });
        const lastItem = dataState.drafts[dataState.drafts.length - 1];

        const drafts = await communityArticleManager.getArticleList({
            limit: 30,
            order: 'DESC',
            drafts: true,
            orderBy: 'updatedAt',
            communityId: options?.communityId,
            updatedBefore: lastItem.communityArticle.updatedAt || new Date(0).toISOString(),
        });

        onFinishedLoading?.();

        dispatch({
            type: 'AppendCommunityDrafts',
            drafts
        });
    } else {
        dispatch({
            type: 'StartLoading',
        });
        const lastItem = dataState.content[dataState.content.length - 1];

        let verification: API.Community.getArticleList.Request['verification'] = 'verified';
        if (!!options?.communityId) {
            verification = 'both';
        } else if (options?.following) {
            verification = 'following';
        }

        const communityContent = await communityArticleManager.getArticleList({
            limit: 30,
            order: 'DESC',
            communityId: options?.communityId,
            tags: options?.tags,
            anyTags: options?.anyTags,
            publishedBefore: lastItem.communityArticle.published || new Date(0).toISOString(),
            verification
        });

        onFinishedLoading?.();
        dispatch({
            type: 'AppendCommunityContent',
            content: communityContent
        });
    }
}
