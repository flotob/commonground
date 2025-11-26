// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

/*
   @param time: the exact amount of time the scrolling will take (in milliseconds)
   @param pos: the y-position to scroll to (in pixels)
*/
export function scrollToSmoothly(element: HTMLDivElement, pos: number, time: number) {
    const currentPos = element.scrollTop;
    let start: number | null = null;

    window.requestAnimationFrame(function step(currentTime) {
        start = !start ? currentTime : start;
        const progress = currentTime - start;

        if (currentPos < pos) {
            element.scrollTo(0, ((pos - currentPos) * progress / time) + currentPos);
        } else {
            element.scrollTo(0, currentPos - ((currentPos - pos) * progress / time));
        }
        if (progress < time) {
            window.requestAnimationFrame(step);
        } else {
            element.scrollTo(0, pos);
        }
    });
}