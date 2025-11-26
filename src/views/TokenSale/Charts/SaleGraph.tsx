// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import * as d3 from 'd3';
import { Decimal, priceFn, formatNumberRemoveTrailingZeros } from "../../../common/tokensale/helper";
const strokeColor = "rgba(92,154,213,0.6)";
const fillColor = "rgba(92,154,213,0.2)";
const progressFillColor = "rgba(92,154,213,0.3)";
const progressIndicatorColor = "rgba(92,154,213,1)";
const gridLineColor = "rgba(0, 0, 0, 0.1)";

type SaleGraphProps = {
    saleProgress: bigint;
    className?: string;
    style?: React.CSSProperties;
};

function SaleGraph({ saleProgress, className, style }: SaleGraphProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const updateSvg = useCallback(() => {
        const svgEl = svgRef.current;
        const divEl = divRef.current;
        const mt = 10;
        const mb = 40;
        const ml = 50;
        const mr = 30;

        const saleProgressFloat = parseFloat(ethers.utils.formatEther(saleProgress));
        
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
                const x = (20 * i) / numPoints;
                points.push({
                    x: x,
                    y: priceFn(new Decimal(x)).mul(new Decimal(10).pow(new Decimal(6))).toNumber()
                });
                if (x <= saleProgressFloat) {
                    filledPoints.push({
                        x: x,
                        y: priceFn(new Decimal(x)).mul(new Decimal(10).pow(new Decimal(6))).toNumber()
                    });
                }
            }
            points.push({
                x: 20,
                y: 0,
            }, {
                x: 0,
                y: 0,
            });
            if (filledPoints[filledPoints.length - 1].x !== saleProgressFloat) {
                filledPoints.push({
                    x: saleProgressFloat,
                    y: priceFn(new Decimal(saleProgressFloat)).mul(new Decimal(10).pow(new Decimal(6))).toNumber(),
                });
            }
            filledPoints.push({
                x: saleProgressFloat,
                y: 0,
            }, {
                x: 0,
                y: 0,
            });

            // Define scales
            const xScale = d3.scaleLinear().domain([0, 20]).range([0, innerWidth]);
            const yScale = d3.scaleLinear().domain([0, 0.2]).range([innerHeight, 0]);

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
            const currentX = xScale(saleProgressFloat);

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
                .text(`Current price: ${priceFn(new Decimal(saleProgressFloat)).mul(new Decimal(10).pow(new Decimal(6))).toFixed(3)} µETH`);

            svg.append("text")
                .attr("x", textIsLeftOfCurrentX ? currentX + 5 : currentX - 5)
                .attr("y", 34)
                .attr("fill", progressIndicatorColor)
                .attr("text-anchor", textIsLeftOfCurrentX ? "start" : "end")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .text(`Total invested: ${formatNumberRemoveTrailingZeros(saleProgressFloat, 3)} ETH`);

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
                .text("total ETH");

            svg.append("g")
                .call(d3.axisLeft(yScale).ticks(5))
                .append("text")
                .attr("x", -innerHeight / 2)
                .attr("y", -38)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("font-family", "Inter")
                .attr("font-size", "12px")
                .attr("letter-spacing", "0.01em")
                .text("token price in µETH");
        }
    }, [saleProgress]);

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

    return (
        <div className={className} style={style} ref={divRef}>
            <svg ref={svgRef} className="tokensale-bucket-graph" />
        </div>
    );
}

export default SaleGraph;