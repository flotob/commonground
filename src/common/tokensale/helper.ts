// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Decimal from 'decimal.js';
const LocalDecimal = Decimal.clone({ precision: 80 });
export { LocalDecimal as Decimal };

const k = new LocalDecimal(0.0025);
const a = new LocalDecimal(8_000_000);
const b = new LocalDecimal(-0.5);
const c = new LocalDecimal(2_500_000);

export function priceFn(x: Decimal): Decimal {
    return new LocalDecimal(1).div(reciprokePriceFn(x));
}

function configurablePriceFn(x: Decimal, config: { a: Decimal, b: Decimal, c: Decimal, k: Decimal }): Decimal {
    return new LocalDecimal(1).div(configurableReciprokePriceFn(x, config));
}

function reciprokePriceFn(x: Decimal): Decimal {
    return a.mul(LocalDecimal.exp((k.mul(new Decimal(-1)).mul(x)).plus(b))).add(c);
}

export function configurableReciprokePriceFn(x: Decimal, config: { a: Decimal, b: Decimal, c: Decimal, k: Decimal }): Decimal {
    return config.a.mul(LocalDecimal.exp((config.k.mul(new Decimal(-1)).mul(x)).plus(config.b))).add(config.c);
}

function reciprokePriceFnPrimitive(x: Decimal): Decimal {
    return c.mul(x).sub(a.mul(LocalDecimal.exp((k.mul(new Decimal(-1)).mul(x)).plus(b))).div(k));
}

function configurableReciprokePriceFnPrimitive(x: Decimal, config: { a: Decimal, b: Decimal, c: Decimal, k: Decimal }): Decimal {
    return config.c.mul(x).sub(config.a.mul(LocalDecimal.exp((config.k.mul(new Decimal(-1)).mul(x)).plus(config.b))).div(config.k));
}

export function getExactTokenAmount(startX: Decimal, amount: Decimal): Decimal {
    if (amount.eq(0)) return new LocalDecimal(0);
    const x1 = startX;
    const x2 = startX.plus(amount);

    return reciprokePriceFnPrimitive(x2).minus(reciprokePriceFnPrimitive(x1));
}

export function configurableGetExactTokenAmount(startX: Decimal, amount: Decimal, config: { a: Decimal, b: Decimal, c: Decimal, k: Decimal }): Decimal {
    if (amount.eq(0)) return new LocalDecimal(0);
    const x1 = startX;
    const x2 = startX.plus(amount);

    return configurableReciprokePriceFnPrimitive(x2, config).minus(configurableReciprokePriceFnPrimitive(x1, config));
}

export function formatNumberRemoveTrailingZeros(value: number | Decimal, precision: number = 3): string {
    return value.toFixed(precision).replace(/\.?0+$/, '');
}

export function shortenMillBillNumber(value: number | Decimal): string {
    if (value instanceof Decimal) {
        if (value.gt(new Decimal(1_000_000_000))) {
            return `${formatNumberRemoveTrailingZeros(value.div(new Decimal(1_000_000_000)))}B`;
        }
        else if (value.gt(new Decimal(1_000_000))) {
            return `${formatNumberRemoveTrailingZeros(value.div(new Decimal(1_000_000)))}M`;
        }
        else if (value.gt(new Decimal(1_000))) {
            return `${formatNumberRemoveTrailingZeros(value.div(new Decimal(1_000)))}k`;
        }
    }
    else {
        if (value > 1_000_000_000) {
            return `${formatNumberRemoveTrailingZeros(value / 1_000_000_000)}B`;
        }
        else if (value > 1_000_000) {
            return `${formatNumberRemoveTrailingZeros(value / 1_000_000)}M`;
        }
        else if (value > 1_000) {
            return `${formatNumberRemoveTrailingZeros(value / 1_000)}k`;
        }
    }
    return formatNumberRemoveTrailingZeros(value);
}