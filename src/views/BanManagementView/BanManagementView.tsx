// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./BanManagementView.css";
import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import BanManagement from "../../components/templates/CommunityLobby/BanManagement/BanManagement";

type Props = {

}

export default function MemberManagementView(props: Props) {
    const { community } = useLoadedCommunityContext();

    if (!!community) {
        return (<div className="ban-management-view">
            <BanManagement />
        </div>);
    }
    return null;
}