// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import KeyStringRenderer from "./KeyStringRenderer";

import './KeyPhrase.css';

type Props = {
    mnemonic: string[];
    hidden: boolean;
}

export default function KeyPhrase(props: Props) {
    const { mnemonic, hidden } = props;

    return (
        <>
            <div className="keyphrase">
                <div className="mnemonic-container">
                    {
                        mnemonic.map((keyString: string, key: number) => <KeyStringRenderer id={key + 1} keyString={hidden ? '*****' :  keyString} key={key} />)
                    }
                </div>
            </div>
        </>
    )
}