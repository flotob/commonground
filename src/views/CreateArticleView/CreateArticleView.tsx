// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import ArticleManagement from "components/templates/CommunityLobby/ArticleManagement/ArticleManagement";
import Scrollable from "components/molecules/Scrollable/Scrollable";

import "./CreateArticleView.css";

type Props = {

}

export default function CreateArticleView(props: Props) {
    const { community, communityPermissions } = useLoadedCommunityContext();
    const { isMobile } = useWindowSizeContext();

    if (!!community) {
        const maincontent = (
            <Scrollable>
                <div className="create-article-view-inner">
                    <ArticleManagement community={community} />
                </div>
            </Scrollable>
        );

        if (isMobile) {
            return <div className="create-article-view">
                {maincontent}
            </div>;
        } else {
            let showAdminPanel = communityPermissions.has('COMMUNITY_MANAGE_ARTICLES');
            return (<div className={`create-article-view ${showAdminPanel ? 'with-admin-panel' : ''}`}>
                {maincontent}
            </div>);
        }
    }

    return null;
}