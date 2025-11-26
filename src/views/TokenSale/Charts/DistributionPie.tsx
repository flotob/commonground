// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Sector, ResponsiveContainer } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

const innerDataInvestable = [
    { name: 'Investable', value: 49 },
];
const innerDataSocial = [
    { name: 'Social', value: 51 },
];
const MIN_SALE = 200_000;
const MAX_SALE = 10_000_000;
const MIN_PERCENT_SALE_INVESTABLE = 1;
const MAX_PERCENT_SALE_INVESTABLE = 10;
const TOTAL_SUPPLY = 100_000_000_000;
const INVESTABLE_SUPPLY = TOTAL_SUPPLY * 0.49;

const MIN_PRICE = MIN_SALE / (TOTAL_SUPPLY * MIN_PERCENT_SALE_INVESTABLE / 100);
const MAX_PRICE = MAX_SALE / (TOTAL_SUPPLY * MAX_PERCENT_SALE_INVESTABLE / 100);

const DistributionPie: React.FC = () => {
    const [investableIndex, setInvestableIndex] = React.useState<number | undefined>();
    const [socialIndex, setSocialIndex] = React.useState<number | undefined>();
    const [innerInvestableIndex, setInnerInvestableIndex] = React.useState<number | undefined>();
    const [innerSocialIndex, setInnerSocialIndex] = React.useState<number | undefined>();
    const [saleProceeds, _setSaleProceeds] = React.useState<number>(MIN_SALE);
    const [communityPercent, setCommunityPercent] = React.useState<number>(MIN_PERCENT_SALE_INVESTABLE);
    const [tokenPrice, setTokenPrice] = React.useState<number>(MIN_PRICE);

    const setSaleProceeds = useCallback((value: number) => {
        const factor = (value - MIN_SALE) / (MAX_SALE - MIN_SALE);
        const price = MIN_PRICE + (MAX_PRICE - MIN_PRICE) * factor;
        const percent = ((value / price) / TOTAL_SUPPLY) * 100;
        _setSaleProceeds(value);
        setTokenPrice(price);
        setCommunityPercent(percent);
    }, []);

    const onInvestablePieEnter = useCallback((data: any, index: number, e: React.MouseEvent<Element, MouseEvent>) => {
        console.log(index);
        setInvestableIndex(index);
        setInnerInvestableIndex(0);
        setSocialIndex(undefined);
        setInnerSocialIndex(undefined);
    }, []);
    const onInvestablePieLeave = useCallback((data: any, index: number, e: React.MouseEvent<Element, MouseEvent>) => {
        setInvestableIndex(undefined);
        setInnerInvestableIndex(undefined);
    }, []);

    const onSocialPieEnter = useCallback((data: any, index: number, e: React.MouseEvent<Element, MouseEvent>) => {
        setInvestableIndex(undefined);
        setInnerInvestableIndex(undefined);
        setSocialIndex(index);
        setInnerSocialIndex(0);
        
    }, []);
    const onSocialPieLeave = useCallback((data: any, index: number, e: React.MouseEvent<Element, MouseEvent>) => {
        setSocialIndex(undefined);
        setInnerInvestableIndex(undefined);
    }, []);

    const investableData = useMemo(() => {
        return [
            { name: 'War Chest', value: 15 - communityPercent },
            { name: 'Investors', value: 10 },
            { name: 'Angels', value: 10 },
            { name: 'Team', value: 14 },
            { name: 'Sale', value: communityPercent },
        ];
    }, [communityPercent]);
    const socialData = useMemo(() => {
        return [
            { name: 'Future', value: 41 },
            { name: 'Pre-Sale & Sale', value: 10 },
        ];
    }, []);

    const renderActiveShape = useCallback((label: string, props: PieSectorDataItem) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, name } = props;
        if (!payload || !midAngle || !cx || !cy || !outerRadius || !percent) return <></>;
    
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';
    
        console.log("Graph mouseEnter payload(s): ", payload)
    
        return (
            <g>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill={"black"}>
                    {label}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 6}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${name}`}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                    {`(${value?.toFixed(2)}%)`}
                </text>
            </g>
        );
    }, []);

    const startAngle = 90;
    const socialColor = "red";
    const investableColor = "blue";

    return (
        <>
            <h3 className='text-center'>Sale Proceeds: {saleProceeds.toLocaleString()} $</h3>
            <input
                type="range"
                min={MIN_SALE}
                max={MAX_SALE}
                step={1}
                className='w-full'
                value={saleProceeds}
                onChange={(e) => setSaleProceeds(parseInt(e.target.value))}
            />
            <h3 className='text-center'>Sale Investable Share: {communityPercent.toFixed(2)} of 49%</h3>
            <h3 className='text-center'>Price per Token: {tokenPrice.toFixed(9)} $</h3>
            <h3 className='text-center'>Total Valuation of Investable Supply: {Math.floor(INVESTABLE_SUPPLY * tokenPrice).toLocaleString()} $</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart width={400} height={400}>
                    <Pie
                        activeIndex={innerInvestableIndex}
                        data={innerDataInvestable}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={59}
                        fill={investableColor}
                        dataKey="value"
                        startAngle={startAngle}
                        endAngle={startAngle + 176.4}
                    />
                    <Pie
                        activeIndex={innerSocialIndex}
                        data={innerDataSocial}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={59}
                        fill={socialColor}
                        dataKey="value"
                        startAngle={startAngle}
                        endAngle={startAngle - 183.6}
                    />

                    <Pie
                        activeIndex={investableIndex}
                        activeShape={renderActiveShape.bind(null, "Investable")}
                        data={investableData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill={investableColor}
                        dataKey="value"
                        onMouseEnter={onInvestablePieEnter}
                        onMouseLeave={onInvestablePieLeave}
                        startAngle={startAngle}
                        endAngle={startAngle + 176.4}
                        animationDuration={400}
                        animationEasing='ease-in-out'
                    />
                    <Pie
                        activeIndex={socialIndex}
                        activeShape={renderActiveShape.bind(null, "Social")}
                        data={socialData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill={socialColor}
                        dataKey="value"
                        onMouseEnter={onSocialPieEnter}
                        onMouseLeave={onSocialPieLeave}
                        startAngle={startAngle}
                        endAngle={startAngle - 183.6}
                        animationDuration={400}
                        animationEasing='ease-in-out'
                    />
                </PieChart>
            </ResponsiveContainer>
        </>
    );
};

export default DistributionPie;