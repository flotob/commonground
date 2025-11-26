// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useMemo } from "react";
import "./NotificationCount.css";

type Props = {
    notificationCount: number;
    noOutline?: boolean;
    noAbsolute?: boolean;
}

export default function NotificationCount(props: Props) {
    const { notificationCount, noOutline, noAbsolute } = props;

    const count = useMemo(() => {
        if (notificationCount && notificationCount > 0) {
            if (notificationCount > 9) {
                return "9+";
            } else {
                return notificationCount;
            }
        } else {
            return null;
        }
    }, [notificationCount]);
    
    if (!count) return null;
    const className = [
        "notification-count",
        noOutline ? '' : 'outlined',
        noAbsolute ? '' : 'absolute'
    ].join(' ').trim();

    return <span className={className}>{count}</span>;
}