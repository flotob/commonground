// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

type LoadingState = 'IDLE' | 'LOADING' | 'DONE';

type UserCommunityState = {
    state: LoadingState;
    communityList: Models.Community.ListView[];
};

type StartLoadingAction = {
    type: 'StartLoading';
}

type FetchCommunitiesAction = {
    type: 'FetchCommunities';
    communityList: Models.Community.ListView[];
}

type Action = StartLoadingAction | FetchCommunitiesAction;

export const userCommunityInitialState: UserCommunityState = {
    state: 'LOADING',
    communityList: []
};

export function userCommunityReducer(state: UserCommunityState, action: Action): UserCommunityState {
    switch (action.type) {
        case 'StartLoading':
            return {
                ...state,
                state: 'LOADING'
            };
        case 'FetchCommunities':
            return {
                state: 'IDLE',
                communityList: action.communityList
            };
        default:
            throw new Error('Invalid reducer action');
    }
};
