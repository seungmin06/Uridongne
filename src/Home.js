 import React, { useState, useEffect } from 'react';
import geoData from './data/서울_자치구_경계_2017.json';
import geoDataa from './data/서울_행정동_경계_2017.json';
import NEWS_components from './components/news.js'
import Crime_components from './components/crime.js'
import Kindergarten_components from './components/kindergarten.js'
import Traffic_components from './components/traffic.js'
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

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);



    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const fetchArticles = async (keyword) => {
        try {
            const response = await fetch(`https://api-v2.deepsearch.com/v1/articles?keyword=${encodeURIComponent(selectedPolygon)}&page_size=3&date_from=2024-01-01&date_to=${formattedDate}&api_key=87fe968f6dc34943b28a5216132cf9d3`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            console.log(data); // 데이터 확인
            setArticles(data.data); // articles 데이터 저장
        } catch (error) {
            setError(error.message); // 에러 저장
        } finally {
            setLoading(false); // 로딩 상태 종료
        }
    };

    useEffect(() => {
        if (selectedPolygon) {
            setLoading(true);
            fetchArticles(selectedPolygon); // 선택된 지역으로 기사 가져오기
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

    // zoom 값에 따라 사용할 데이터를 선택
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

                                // zoom 값에 따라 구명 또는 동명 표시
                                const label = zoom >= 2
                                    ? feature.properties.adm_nm.split(' ').slice(-1)[0] // geoDataa에서는 동명만 추출
                                    : feature.properties.SIG_KOR_NM; // geoData에서는 구명 사용

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
                                            onClick={() => setSelectedPolygon(label)} // 구명 또는 동명 선택
                                        />
                                        {zoom >= 1 && (
                                            <g transform={`translate(${centerXText}, ${centerYText})`}>
                                                <text
                                                    fontSize={zoom >= 2 ? fontSize * 0.4 : fontSize} // zoom 값에 따라 폰트 크기 조정
                                                    fill="black"
                                                    textAnchor="middle"
                                                    transform='scale(1, -1)'
                                                >
                                                    {label} {/* 구명 또는 동명 표시 */}
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

                <div id='info_wrap'>
                    
                </div>

                <div id='chart_wrap'>
                    <Crime_components  selectedPolygon={selectedPolygon}/>
                    <Kindergarten_components  selectedPolygon={selectedPolygon}/>
                    <Traffic_components  selectedPolygon={selectedPolygon}/>
                    <NEWS_components selectedPolygon={selectedPolygon} />

                </div>

            </div>

        </div>
    );
}

export default Around;
