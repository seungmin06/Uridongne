import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
    const [data, setData] = useState(null);
    const [labels, setLabels] = useState([]);
    const [contribution, setContribution] = useState('');
    const [message, setMessage] = useState('');
    const [isAboveAverage, setIsAboveAverage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: fetchedData, error } = await supabase
                .from('uridongne_공원')
                .select('*')
                .eq('자치구', selectedPolygon);

            if (error) {
                console.error('Error fetching data:', error);
            } else if (fetchedData.length > 0) {
                const rowData = fetchedData[0];
                setData(rowData);
                const years = Object.keys(rowData).filter(key => key !== '자치구');
                setLabels(years);

                const selected2021 = parseFloat(rowData['2021']);

                const { data: totalData, error: totalError } = await supabase
                    .from('uridongne_공원')
                    .select('*')
                    .eq('자치구', '소계');

                if (totalError) {
                    console.error('Error fetching total data:', totalError);
                } else if (totalData.length > 0) {
                    const total2021 = parseFloat(totalData[0]['2021']);

                    if (!isNaN(selected2021) && !isNaN(total2021) && total2021 > 0) {
                        const contributionPercentage = ((selected2021 / total2021) * 100).toFixed(2);
                        setContribution(`${contributionPercentage}%`);
                    } else {
                        setContribution('유효한 2021년 데이터가 없습니다.');
                    }
                }

                const allData = await fetchAllKindergartens();
                const allKindergartens = allData.map(row => parseFloat(row['2021'])).filter(num => !isNaN(num));

                const sortedData = [...allKindergartens].sort((a, b) => b - a);
                const fiftyPercentIndex = Math.floor(sortedData.length * 0.5);
                const fiftyPercentValue = sortedData[fiftyPercentIndex];

                if (selected2021 > fiftyPercentValue) {
                    setMessage('공원 수가 많습니다.');
                    setIsAboveAverage(true);
                } else {
                    setMessage('공원 수가 평균 이하입니다.');
                    setIsAboveAverage(false);
                }
            }
        };

        if (selectedPolygon) {
            fetchData();
        }
    }, [selectedPolygon]);

    const fetchAllKindergartens = async () => {
        const { data: allData, error } = await supabase
            .from('uridongne_공원')
            .select('*');

        if (error) {
            console.error('Error fetching all data:', error);
            return [];
        }

        return allData;
    };

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: '공원수',
                data: labels.map(year => data ? parseFloat(data[year]) : 0),
                backgroundColor: isAboveAverage ? 'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)',
                borderColor: isAboveAverage ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div id='kinder_chart'>
            <Bar data={chartData} />
            <p></p>
            <p>전체 공원의 {contribution}만큼의 공원 수를 보유중</p>
            <p style={{ color: isAboveAverage ? 'red' : 'blue' }}>{message}</p>
        </div>
    );
};

export default App;
