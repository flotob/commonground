// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export function messageToPlainText(body: Models.Message.Body) {
    const result = body.content.map(content => {
        switch (content.type) {
            case 'text':
                return content.value;
            case 'mention':
                return content.alias || content.userId;
            case 'newline':
                return '\n';
            case 'tag':
                return `#${content.value}`;
            case 'link':
                return content.value;
            case 'richTextLink':
                return content.value;
            case 'ticker':
                return content.value;
            default:
                return '';
        }
    }).filter(Boolean).join(' ');
    return result;
}