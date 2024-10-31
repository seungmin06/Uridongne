import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
    const [data, setData] = useState(null);
    const [labels, setLabels] = useState([]);
    const [totalContribution, setTotalContribution] = useState('');
    const [yearlyChange, setYearlyChange] = useState('');
    const [isIncrease, setIsIncrease] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: fetchedData, error } = await supabase
                .from('uridongne_인구수')
                .select('*')
                .eq('자치구', selectedPolygon);

            if (error) {
                console.error('Error fetching data:', error);
            } else if (fetchedData.length > 0) {
                const rowData = fetchedData[0];
                setData(rowData);
                const years = Object.keys(rowData).filter(key => key !== '자치구');
                setLabels(years);

                const selected2024 = parseFloat(rowData['2024']);

                const { data: totalData, error: totalError } = await supabase
                    .from('uridongne_인구수')
                    .select('*')
                    .eq('자치구', '합계');

                if (totalError) {
                    console.error('Error fetching total data:', totalError);
                } else if (totalData.length > 0) {
                    const total2024 = parseFloat(totalData[0]['2024']);
                    if (!isNaN(selected2024) && !isNaN(total2024) && total2024 > 0) {
                        const contributionPercentage = ((selected2024 / total2024) * 100).toFixed(2);
                        setTotalContribution(`${contributionPercentage}%`);
                    } else {
                        setTotalContribution('유효한 2024년 데이터가 없습니다.');
                    }
                }

                const selected2023 = parseFloat(rowData['2023']);
                if (!isNaN(selected2023) && selected2023 > 0) {
                    const changePercentage = (((selected2024 - selected2023) / selected2023) * 100).toFixed(2);
                    setYearlyChange(`${changePercentage > 0 ? '+' : ''}${changePercentage}%`);
                    setIsIncrease(changePercentage > 0);
                } else {
                    setYearlyChange('유효한 2023년 데이터가 없습니다.');
                }
            }
        };

        if (selectedPolygon) {
            fetchData();
        }
    }, [selectedPolygon]);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: '인구수',
                data: labels.map(year => data ? parseFloat(data[year]) : 0),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div id='population_chart'>
            <Bar data={chartData} />
            <p>서울시 전체 인구수 중 {totalContribution} 비율</p>
            <span>
                작년 대비 <p style={{ color: isIncrease ? 'red' : 'blue', display: 'inline' }}>
                    {yearlyChange} 만큼 {isIncrease ? '늘었어요' : '줄었어요'}
                </p>
            </span>
        </div>
    );
};

export default App;
