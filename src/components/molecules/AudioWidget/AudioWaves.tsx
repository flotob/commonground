// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useMemo } from "react";
import './AudioWidget.css';

export default function AudioWaves() {
  const component = useMemo(() => {
    return (
      <div className="audio-waves-animation">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" preserveAspectRatio="xMidYMid meet" style={{
          width: "100%",
          height: "100%",
          transform: "translate3d(0px, 0px, 0px)",
          contentVisibility: "visible"
        }}>
          <g>
            <rect id="audio-wave-1" x="2.9" y="7" width="3" height="3" rx="1.5" ry="1.5" fill="currentColor">
              <animate attributeName="height" attributeType="XML" dur="2.1s" values="3;3;11;11;3" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
              <animate attributeName="y" attributeType="XML" dur="2.1s" values="7;7;3;3;7" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
            </rect>
            <rect id="audio-wave-2" x="7.5" y="7" width="3" height="3" rx="1.5" ry="1.5" fill="currentColor">
              <animate attributeName="height" attributeType="XML" begin="1.4s" dur="2.1s" values="3;3;11;11;3" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
              <animate attributeName="y" attributeType="XML" begin="1.4s" dur="2.1s" values="7;7;3;3;7" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
            </rect>
            <rect id="audio-wave-3" x="11.9" y="7" width="3" height="3" rx="1.5" ry="1.5" fill="currentColor">
              <animate attributeName="height" attributeType="XML" begin="0.7s" dur="2.1s" values="3;3;11;11;3" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
              <animate attributeName="y" attributeType="XML" begin="0.7s" dur="2.1s" values="7;7;3;3;7" keyTimes="0;0.5;0.7;0.8;1" repeatCount="indefinite" />
            </rect>
          </g>
        </svg>
      </div>
    )
  }, []);
  return component;
}