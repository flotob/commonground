// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import EndImg from '../../../static/home-cta-end.png';
import "./SectionEnd.css";

type Props = {
    text: string;
    footer?: JSX.Element
}

export default function SectionEnd(props: Props) {
    const { text, footer } = props;

    return (
        <div className="end-section">
            <img src={EndImg} alt="end" className="end-image" />
            <p className="end-section-text">{text}</p>
            {footer}
        </div>
    );
}