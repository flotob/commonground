// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./MemberApplicationView.css";
import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import MemberApplicationManagement from "components/templates/CommunityLobby/MemberApplicationManagement/MemberApplicationManagement";

type Props = {

}

export default function MemberApplicationView(props: Props) {
    const { community } = useLoadedCommunityContext();

    if (!!community) {
        return (<div className="member-application-view">
            <MemberApplicationManagement />
        </div>);
    }
    return null;
}