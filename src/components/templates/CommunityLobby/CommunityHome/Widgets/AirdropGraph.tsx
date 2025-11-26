// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from 'd3';
import { Decimal, configurableReciprokePriceFn, configurableGetExactTokenAmount } from "../../../../../common/tokensale/helper";

type SaleGraphProps = {
    usersClaimed: number;
    role: Models.Community.Role & { airdropConfig: Models.Community.RoleAirdropConfig };
    bonusPercent?: number;
    className?: string;
    style?: React.CSSProperties;
};

function AirdropGraph({
    usersClaimed,
    className,
    style,
    role,
    bonusPercent,
}: SaleGraphProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const { airdropConfig } = role;

    const params = useMemo(() => {
        return airdropConfig.functionParameters;
    }, [airdropConfig]);

    const maximumUsers = useMemo(() => {
        return airdropConfig.maximumUsers;
    }, [airdropConfig.maximumUsers]);

    const configObject = useMemo(() => {
        return {
            a: new Decimal(params.a),
            b: new Decimal(params.b),
            c: new Decimal(params.c),
            k: new Decimal(params.k),
        };
    }, [params.a, params.b, params.c, params.k]);

    const strokeColor = role.airdropConfig.style?.strokeColor || '#000000';
    const fillColor = role.airdropConfig.style?.fillColor || '#000000';
    const progressFillColor = role.airdropConfig.style?.progressFillColor || '#000000';
    const progressIndicatorColor = role.airdropConfig.style?.progressIndicatorColor || '#000000';
    const gridLineColor = role.airdropConfig.style?.gridLineColor || '#000000';

    const bonusFactor = useMemo(() => {
        if (!bonusPercent) return new Decimal(1);
        return new Decimal(1).plus(bonusPercent / 100);
    }, [bonusPercent]);

    const updateSvg = useCallback(() => {
        if (!configObject || !maximumUsers) {
            return;
        }

        const svgEl = svgRef.current;
        const divEl = divRef.current;
        const mt = 10;
        const mb = 40;
        const ml = 75;
        const mr = 30;
        
        if (!!divEl && !!svgEl) {
            const width = divEl.clientWidth;
            const height = divEl.clientHeight;
            const innerWidth = width - ml - mr;
            const innerHeight = height - mt - mb;

            // Generate price curve data points
            const points: { x: number, y: number }[] = [];
            const filledPoints: { x: number, y: number }[] = [];
            const numPoints = 200; // number of points to plot
            for (let i = 0; i <= numPoints; i++) {
                const x = (maximumUsers * i) / numPoints;
                points.push({
                    x: x,
                    y: configurableReciprokePriceFn(new Decimal(x), configObject).mul(bonusFactor).toNumber()
                });
                if (x <= usersClaimed) {
                    filledPoints.push({
                        x: x,
                        y: configurableReciprokePriceFn(new Decimal(x), configObject).mul(bonusFactor).toNumber()
                    });
                }
            }
            points.push({
                x: maximumUsers,
                y: 0,
            }, {
                x: 0,
                y: 0,
            });
            if (filledPoints[filledPoints.length - 1].x !== usersClaimed) {
                filledPoints.push({
                    x: usersClaimed,
                    y: configurableReciprokePriceFn(new Decimal(usersClaimed), configObject).mul(bonusFactor).toNumber(),
                });
            }
            filledPoints.push({
                x: usersClaimed,
                y: 0,
            }, {
                x: 0,
                y: 0,
            });

            // Define scales
            const xScale = d3.scaleLinear().domain([0, maximumUsers]).range([0, innerWidth]);
            const yScale = d3.scaleLinear().domain([0, configurableReciprokePriceFn(new Decimal(0), configObject).mul(bonusFactor).toNumber()]).range([innerHeight, 0]);

            // Clear svg
            d3.select(svgEl).selectAll("*").remove()

            const svg = d3.select(svgEl)
                .attr('viewBox', [-ml, -mt, width, height])
                .style('width', `${width}px`)
                .style('height', `${height}px`)
                .style('max-width', `100%`);

            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));
    
            // Append the price curve
            svg.append("path")
                .datum(points)
                .attr("stroke", strokeColor)
                .attr("fill", fillColor)
                .attr("class", "tokensale-line")
                .attr("d", line)
                .style("vector-effect", "non-scaling-stroke");

            // Append the filled area
            svg.append("path")
                .datum(filledPoints)
                .attr("stroke", "none")
                .attr("fill", progressFillColor)
                .attr("class", "tokensale-line")
                .attr("d", line)
                .style("vector-effect", "non-scaling-stroke");
    
            // Add grid lines
            svg.append("g")
                .attr("class", "grid-lines")
                .selectAll("line")
                .data(xScale.ticks(6))
                .join("line")
                .attr("x1", d => xScale(d))
                .attr("x2", d => xScale(d))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1)
                .style("vector-effect", "non-scaling-stroke");

            svg.append("g")
                .attr("class", "grid-lines")
                .selectAll("line")
                .data(yScale.ticks(5))
                .join("line")
                .attr("x1", 0)
                .attr("x2", innerWidth)
                .attr("y1", d => yScale(d))
                .attr("y2", d => yScale(d))
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1)
                .style("vector-effect", "non-scaling-stroke");

            // Add current progress line and label
            const currentX = xScale(usersClaimed);

            if (currentX > 0) {
                svg.append("line")
                    .attr("x1", currentX)
                    .attr("x2", currentX)
                    .attr("y1", 0)
                    .attr("y2", innerHeight)
                    .attr("stroke", progressIndicatorColor)
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5")
                    .style("vector-effect", "non-scaling-stroke");
            }

            const textIsLeftOfCurrentX = currentX < innerWidth / 2;
            svg.append("text")
                .attr("x", textIsLeftOfCurrentX ? currentX + 5 : currentX - 5)
                .attr("y", 17)
                .attr("fill", progressIndicatorColor)
                .attr("text-anchor", textIsLeftOfCurrentX ? "start" : "end")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .text(`Reward for next user: ${configurableReciprokePriceFn(new Decimal(usersClaimed), configObject).mul(bonusFactor).toNumber().toLocaleString('en-US', { maximumFractionDigits: 2 })} $CG`);

            svg.append("text")
                .attr("x", textIsLeftOfCurrentX ? currentX + 5 : currentX - 5)
                .attr("y", 34)
                .attr("fill", progressIndicatorColor)
                .attr("text-anchor", textIsLeftOfCurrentX ? "start" : "end")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .text(`Users claimed: ${usersClaimed}`);

            // Add axes
            svg.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(d3.axisBottom(xScale).ticks(6))
                .append("text")
                .attr("x", innerWidth / 2)
                .attr("y", 35)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .attr("letter-spacing", "0.01em")
                .text("Users claimed");

            svg.append("g")
                .call(d3.axisLeft(yScale).ticks(5))
                .append("text")
                .attr("x", -innerHeight / 2)
                .attr("y", -58)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .attr("letter-spacing", "0.01em")
                .text("Reward by position");
        }
    }, [usersClaimed, configObject, maximumUsers]);

    useEffect(() => {
        const div = divRef.current;

        const resizeObserver = new ResizeObserver(() => {
            updateSvg();
        });

        if (div) {
            resizeObserver.observe(div);
            updateSvg();
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [updateSvg]);

    return (<>
        <div className={className} style={style} ref={divRef}>
            <svg ref={svgRef} className="tokensale-bucket-graph" />
        </div>
    </>);
}

export default AirdropGraph;