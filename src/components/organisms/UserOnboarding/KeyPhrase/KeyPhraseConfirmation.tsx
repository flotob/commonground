// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useEffect, useState } from "react";
import KeyStringRenderer from "./KeyStringRenderer";

type Props = {
    mnemonic: string[];
    onKeyphraseConfirmation: (confirmed: boolean) => void;
}

export type KeyPhraseInputType = { [id: number]: string };

const KeyPhraseConfirmation = (props: Props) => {
    const { mnemonic, onKeyphraseConfirmation } = props;
    const [ inputKeys, setInputKeys ] = useState<KeyPhraseInputType>({});
    const [ hiddenKeys, setHiddenKeys ] = useState<KeyPhraseInputType>({});

    useEffect(() => {
        const calculatedHiddenKeys: KeyPhraseInputType = {};

        // Shuffle array
        const shuffled = [...mnemonic].sort(() => Math.random() - Math.random());

        // Get sub-array of first 3 elements after shuffled
        const hiddenKeysArr: string[] = shuffled.slice(0, 3);
        
        hiddenKeysArr.forEach((keyString) => {
            const index = mnemonic.indexOf(keyString);
            calculatedHiddenKeys[index + 1] = keyString;
        });
        setHiddenKeys(calculatedHiddenKeys);
        onKeyphraseConfirmation(false);
    }, [mnemonic, onKeyphraseConfirmation]);

    const handleKeyInput = (value: string, id: number) => {
        const inputKeysCopy: KeyPhraseInputType = { ...inputKeys };
        inputKeysCopy[id] = value;
        setInputKeys(inputKeysCopy);

        if (JSON.stringify(inputKeysCopy) === JSON.stringify(hiddenKeys)) {
            onKeyphraseConfirmation(true);
        } else {
            onKeyphraseConfirmation(false);
        }
    }

    return (
        <div className="keyphrase keyphrase-confirmation">
            <h2 className="modal-title">To confirm it is written down, please fill out the empty fields</h2>
            <div className="mnemonic-container">
                {
                    mnemonic.map((keyString: string, key: number) => (
                        <KeyStringRenderer
                            id={key + 1}
                            keyString={keyString}
                            key={key}
                            hidden={hiddenKeys && !!hiddenKeys[key + 1]}
                            onChange={handleKeyInput}
                        />
                    ))
                }
            </div>
        </div>
    )
};

export default KeyPhraseConfirmation;