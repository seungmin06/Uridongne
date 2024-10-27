import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './news.css'

const News = ({ selectedPolygon }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticles = async () => {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];

            try {
                const response = await axios.get(`https://api-v2.deepsearch.com/v1/articles?keyword=${encodeURIComponent(selectedPolygon)}&page_size=3&date_from=2024-04-25&date_to=${formattedDate}&api_key=87fe968f6dc34943b28a5216132cf9d3`);
                setArticles(response.data.data); // articles 데이터 저장
            } catch (error) {
                setError(error.message); // 에러 저장
            } finally {
                setLoading(false); // 로딩 상태 종료
            }
        };

        if (selectedPolygon) {
            fetchArticles();
        }
    }, [selectedPolygon]);

    return (
        <ul id='news_wrap'>
            {error && <p>Error: {error}</p>}
            {articles && articles.length > 0 ? (
                articles.map(article => (
                    <div className='news_area' key={article.id}>
                        <h3 className='news_title'>{article.title}</h3>
                        <div className='news_sub_area'>
                            <a href={article.content_url} target="_blank" rel="noopener noreferrer">
                                <img className='news_img' src={article.image_url} alt={article.title} />
                            </a>
                            <p className='news_summary'>{article.summary}</p>

                        </div>
                        <p className='news_date'>{new Date(article.published_at).toLocaleString()}</p>

                    </div>
                ))
            ) : (
                <p>좌측 지역을 선택해주세요</p>
            )}
        </ul>
    );
};

export default News;
