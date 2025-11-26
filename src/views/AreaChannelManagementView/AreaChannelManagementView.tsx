// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import ChannelManagement from "../../components/templates/CommunityLobby/ChannelManagement/ChannelManagement";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

import "./AreaChannelManagementView.css";

type Props = {

}

export default function AreaChannelManagementView(props: Props) {
    const { community } = useLoadedCommunityContext();
    const { isMobile } = useWindowSizeContext();

    if (!!community) {
        const maincontent = (
            <Scrollable>
                <div className="area-management-view-inner">
                    <ChannelManagement />
                </div>
            </Scrollable>
        );

        if (isMobile) {
            return <div className="area-management-view">
                {maincontent}
            </div>;
        } else {
            return (<div className="area-management-view">
                {maincontent}
            </div>);
        }
    }
    return null;
}