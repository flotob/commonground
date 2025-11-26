// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./MemberManagementView.css";
import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import MemberManagement from "../../components/templates/CommunityLobby/MemberManagement/MemberManagement";

type Props = {

}

export default function MemberManagementView(props: Props) {
    const { community } = useLoadedCommunityContext();

    if (!!community) {
        return (<div className="member-management-view">
            <MemberManagement />
        </div>);
    }
    return null;
}