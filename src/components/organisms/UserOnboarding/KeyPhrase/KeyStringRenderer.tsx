// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

type Props = {
    id: number;
    keyString: string;
    hidden?: boolean;
    value?: string;
    onChange?: (value: string, id: number) => void;
    onPaste?: (ev: React.ClipboardEvent<HTMLInputElement>) => void;
}

export default function KeyStringRenderer(props: Props) {
    const { id, keyString, hidden, value, onChange, onPaste } = props;

    return (
        <div className={`${hidden ? "hidden " : ""}key-string-container`}>
            <span className="key-string-inner">
                <span className="key-string-number">{id}</span>
                {hidden ? <input type="text" className="key-string-input" tabIndex={id} value={value} onChange={(ev) => onChange && onChange(ev.target.value, id)} onPaste={onPaste} />
                    : <span className="key-string-value">{keyString}</span>}
            </span>
        </div>
    );
}