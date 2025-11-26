// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useWindowSizeContext } from 'context/WindowSizeProvider';

interface TokenDistribution {
    name: string;
    value: number;
    color: string;
    description?: string[];
}

const data: TokenDistribution[] = [
    { name: 'Community Fund', value: 51, color: '#ff4444', description: ['This can only be earned by', 'being a good citizen,', 'earning rewards on the app'] },
    { name: 'DUNA Treasury', value: 10.5, color: '#ffdd00', description: ['This is the treasury that', 'is managed by the Common', 'Ground Association'] },
    { name: 'Team', value: 20, color: '#7733ff', description: ['Founders, staff and', 'future hires of the', 'CG development team'] },
    { name: 'Airdrop', value: 1, color: '#008000', description: ['Reward for early users'] },
    { name: 'Angel Investors', value: 7, color: '#ffaacc', description: ['The backers that have', 'brought us to where we', 'are today'] },
    { name: 'Public Token Pool', value: 10.5, color: '#3388ff', description: ['10.5B reserved for public', 'offering of which 80M (0.8%)', 'have been sold so far'] }
];

const TokenDistributionGraph: React.FC = () => {
    const divRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const { isMobile } = useWindowSizeContext();

    const updateSvg = useCallback(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        // Setup dimensions
        const margin = isMobile ? { top: 20, right: 20, bottom: 20, left: 20 } : { top: 50, right: 20, bottom: 50, left: 20 };
        const width = svgRef.current.clientWidth - margin.left - margin.right;
        const height = (isMobile ? svgRef.current.clientWidth : Math.floor(svgRef.current.clientWidth * 0.6)) - margin.top - margin.bottom;
        const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${(width + margin.left + margin.right) / 2},${(height + margin.top + margin.bottom) / 2})`);

        // Create pie generator with padAngle
        const pie = d3.pie<TokenDistribution>()
            .value(d => d.value)
            .startAngle(-225 * (Math.PI / 180))
            .endAngle(135 * (Math.PI / 180))
            .padAngle(0.02)
            .sort(null);

        // Create arc generator for the main donut segments
        const arc = d3.arc<d3.PieArcDatum<TokenDistribution>>()
            .innerRadius(radius * 0.85)
            .outerRadius(radius)
            .padRadius(radius)
            .cornerRadius(6);

        // Helper function to get midpoint angle of a pie segment
        const midAngle = (d: d3.PieArcDatum<TokenDistribution>) => {
            return d.startAngle + (d.endAngle - d.startAngle) / 2 - (90 * Math.PI / 180);
        };

        // Helper function to determine if label should be on right side
        const isRightSide = (d: d3.PieArcDatum<TokenDistribution>) => {
            const angle = (midAngle(d) * 180 / Math.PI) % 360;
            return angle > -90 && angle < 90;
        };

        // Add the donut segments
        const segments = svg.selectAll('path.segment')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('class', 'segment')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke-width', '0')
            .attr('stroke', 'none')
            .style('transition', 'transform 0.3s ease')
            // .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '2')
                    .attr('stroke', 'var(--text-primary)');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0')
                    .attr('stroke', 'none');
            })
            .on('click', function(event, d) {
                console.log('Segment clicked', event, d.data.name);
            });

        if (!isMobile) {
            // Create label groups
            const labelGroups = svg.selectAll('g.label-group')
                .data(pie(data))
                .enter()
                .append('g')
                .attr('class', 'label-group')
                .attr('style', 'pointer-events: none');

            // Add label lines
            labelGroups.each(function(d) {
                const group = d3.select(this);
                const startPoint = arc.centroid(d);
                const midRadius = radius * 1.15; // Adjust this value to control how far the orthogonal line extends
                const endRadius = radius * 1.5;  // Adjust this value to control how far the horizontal line extends
                
                // Calculate the midpoint for the orthogonal line
                const angle = midAngle(d);
                const midPoint = [
                    Math.cos(angle) * midRadius,
                    Math.sin(angle) * midRadius
                ];
                
                // Calculate the end point for the horizontal line
                const endPoint = [
                    Math.cos(angle) * endRadius,
                    midPoint[1]
                ];

                // Create the path for both lines
                const pathData = `
                    M ${startPoint[0]},${startPoint[1]}
                    L ${midPoint[0]},${midPoint[1]}
                    L ${endPoint[0]},${endPoint[1]}
                `;

                group.append('path')
                    .attr('d', pathData)
                    .attr('fill', 'none')
                    .attr('stroke', 'var(--text-primary)')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '2,2')
                    .style('pointer-events', 'none');

                // Add text labels
                const textX = endPoint[0] + (isRightSide(d) ? 10 : -10);
                const text = group.append('text')
                    .attr('transform', `translate(${textX},${endPoint[1]})`)
                    .attr('text-anchor', isRightSide(d) ? 'start' : 'end')
                    .style('font-family', 'Inter, sans-serif')
                    .style('font-size', '14px')
                    .style('pointer-events', 'none')
                    .style('fill', 'var(--text-primary)');

                text.append('tspan')
                    .attr('x', 0)
                    .attr('dy', '-0.5em')
                    .text(`${d.data.value}% ${d.data.name}`)
                    .style('pointer-events', 'none')
                    .style('fill', 'var(--text-primary)')
                    .classed('cg-text-md-500', true);

                d.data.description?.forEach((line) => {
                    text.append('tspan')
                        .attr('x', 0)
                        .attr('dy', `1.2em`)
                        .text(line)
                        .style('pointer-events', 'none')
                        .style('fill', 'var(--text-secondary)')
                        .style('width', '172px')
                        .classed('cg-text-sm-400', true);                    
                });
            });
        }
    }, [isMobile]);

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
        <div 
            ref={divRef} 
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            <svg ref={svgRef} style={{ width: 'min(100%, 800px)', height: 'auto' }} />
            {isMobile && <div className='w-full flex justify-center'>
                <div className='flex flex-col gap-2 cg-text-main'>
                    {data.map(d => (<div className='w-full'>
                        <div key={d.name} className='flex flex-row gap-2 items-center'>
                            <div className='w-4 h-4 rounded-full' style={{ backgroundColor: d.color }} />
                            <span>{d.name} ({d.value}%)</span>
                        </div>
                        <div key={d.name + 'description'} className='flex flex-col gap-2 cg-text-secondary text-sm text-left'>
                            {d.description?.join(' ')}
                        </div>
                    </div>))}
                </div>
            </div>}
        </div>
    );
};

export default TokenDistributionGraph;
