// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./LiveCallSlider.css";
import { Ref, useMemo } from "react";
import { useWindowSizeContext } from "../../../context/WindowSizeProvider";
import LiveCallCard from "../LiveCallCard/LiveCallCard";

type Props = {
    containerRef: Ref<HTMLDivElement>;
    items: Models.Calls.Call[];
    cardCountLimit?: number;
    hideCommunity?: boolean;
}

export default function LiveCallSlider(props: Props) {
    const { isMobile, isTablet, isSmallTablet } = useWindowSizeContext();
    const { items, cardCountLimit, containerRef, hideCommunity } = props;

    const filteredItems = useMemo(() => {
        if (cardCountLimit) {
            return items.slice(0, cardCountLimit);
        } else {
            return items;
        }
    }, [items, cardCountLimit]);

    let extraContainerClassname = 'desktop';
    if (isSmallTablet) {
        extraContainerClassname = 'smallTablet';
    } else if (isTablet) {
        extraContainerClassname = 'tablet';
    } else if (isMobile) {
        extraContainerClassname = 'mobile';
    }

    return (
        <div className={`live-call-slider ${extraContainerClassname}`} ref={containerRef}>
            {isMobile && <div className="px-1 ml-0 pl-0" />}
            {filteredItems.map(call => {
                return (<div key={call.channelId} className="px-1 self-stretch">
                    <LiveCallCard call={call} hideCommunity={hideCommunity} />
                </div>);
            })}
        </div>
    );
}