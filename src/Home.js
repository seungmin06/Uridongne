import React, { useState, useEffect } from 'react';
import geoData from './data/서울_자치구_경계_2017.json';
import geoDataa from './data/서울_행정동_경계_2017.json';
import NEWS_components from './components/news.js'
import Crime_components from './components/crime.js'
import Kindergarten_components from './components/kindergarten.js'
import Traffic_components from './components/traffic.js'
import Park_components from './components/park.js'
import Population_components from './components/population.js'
import Hospital_components from './components/hospital.js'
import Educational_components from './components/educational.js'
import Main_components from './components/main.js'


import './Home.css';

function Around() {
    const width = 900; // SVG 너비
    const height = 600; // SVG 높이
    const scale = 2100; // 좌표 변환 비율 (조정 필요)

    const coordinates = geoData.features.flatMap(feature =>
        feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates[0]
            : feature.geometry.coordinates.flatMap(polygon => polygon[0])
    );

    const minX = Math.min(...coordinates.map(coord => coord[0]));
    const maxX = Math.max(...coordinates.map(coord => coord[0]));
    const minY = Math.min(...coordinates.map(coord => coord[1]));
    const maxY = Math.max(...coordinates.map(coord => coord[1]));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = centerX * scale;
    const offsetY = centerY * scale;

    const fontSize = 15;

    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [hoveredPolygon, setHoveredPolygon] = useState(null);
    const [selectedPolygon, setSelectedPolygon] = useState(null);

    const [loading, setLoading] = useState(true);



    const today = new Date();


    useEffect(() => {
        if (selectedPolygon) {
            setLoading(true);
        }
    }, [selectedPolygon]);

    const handleWheel = (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        setZoom((prevZoom) => Math.max(0.1, prevZoom + (event.deltaY > 0 ? -zoomFactor : zoomFactor)));
    };

    const handleMouseDown = (event) => {
        setIsDragging(true);
        setStartCoords({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event) => {
        if (isDragging) {
            const dx = event.clientX - startCoords.x;
            const dy = event.clientY - startCoords.y;
            setTranslate(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));
            setStartCoords({ x: event.clientX, y: event.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const activeGeoData = zoom >= 2 ? geoDataa : geoData;

    return (
        <div id='home'>
            <h1 id='title'>{selectedPolygon} 살만한가</h1>
            <div id='wrap'>

                <svg
                    width={width}
                    height={height}
                    style={{ border: '1px solid black' }}
                    viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <g transform={`translate(${translate.x}, ${translate.y}) scale(${zoom}) scale(1, -1)`}>
                        {activeGeoData.features.map((feature, index) => {
                            if (feature.geometry.type === 'Polygon') {
                                const points = feature.geometry.coordinates[0].map(coord => {
                                    const x = (coord[0] * scale) - offsetX;
                                    const y = (coord[1] * scale) - offsetY;
                                    return `${x},${y}`;
                                }).join(' ');

                                const centerLatLng = feature.geometry.coordinates[0].reduce(
                                    (acc, coord) => {
                                        acc[0] += coord[0];
                                        acc[1] += coord[1];
                                        return acc;
                                    }, [0, 0]
                                ).map(value => value / feature.geometry.coordinates[0].length);

                                const centerXText = (centerLatLng[0] * scale) - offsetX;
                                const centerYText = (centerLatLng[1] * scale - 10) - offsetY;

                                const isHovered = hoveredPolygon === `${index}`;
                                const strokeColor = isHovered ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 0, 0, 0.5)';
                                const fillColor = isHovered ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0)';

                                const label = zoom >= 2
                                    ? feature.properties.adm_nm.split(' ').slice(-1)[0] 
                                    : feature.properties.SIG_KOR_NM; 

                                return (
                                    <g key={index}>
                                        <polygon
                                            cursor={'pointer'}
                                            points={points}
                                            stroke={strokeColor}
                                            strokeWidth="0.2"
                                            fill={fillColor}
                                            onMouseEnter={() => { setHoveredPolygon(`${index}`); }}
                                            onMouseLeave={() => setHoveredPolygon(null)}
                                            onClick={() => setSelectedPolygon(label)}
                                        />
                                        {zoom >= 1 && (
                                            <g transform={`translate(${centerXText}, ${centerYText})`}>
                                                <text
                                                    fontSize={zoom >= 2 ? fontSize * 0.4 : fontSize}
                                                    fill="black"
                                                    textAnchor="middle"
                                                    transform='scale(1, -1)'
                                                >
                                                    {label}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            }
                            return null;
                        })}
                    </g>
                </svg>

                <div id='chart_wrap'>
                    <Crime_components selectedPolygon={selectedPolygon} />
                    <Kindergarten_components selectedPolygon={selectedPolygon} />
                    <Traffic_components selectedPolygon={selectedPolygon} />
                    <Park_components selectedPolygon={selectedPolygon} />
                    <Population_components selectedPolygon={selectedPolygon} />
                    <Hospital_components selectedPolygon={selectedPolygon} />
                    <Educational_components selectedPolygon={selectedPolygon} />
                    <Main_components selectedPolygon={selectedPolygon} />
                </div>
                <h1 id='news_title_'>최신 기사</h1>
                <NEWS_components selectedPolygon={selectedPolygon} />


            </div>

        </div>
    );
}

export default Around;
