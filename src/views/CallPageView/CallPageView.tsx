// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLoadedCommunityContext } from "../../context/CommunityProvider";
import CallPage from "components/organisms/CallPage/CallPage";

import "./CallPageView.css";

export default function CallPageView() {
    const { community } = useLoadedCommunityContext();

    if (!!community) {
        return (<div className="call-page-view">
            <CallPage />
        </div>);
    }
    return null;
}