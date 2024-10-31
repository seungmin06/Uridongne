import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
    const [data, setData] = useState(null);
    const [labels, setLabels] = useState([]);
    const [contribution, setContribution] = useState('');
    const [trend, setTrend] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const { data: fetchedData, error } = await supabase
                .from('uridongne_병원수')
                .select('*')
                .eq('자치구', selectedPolygon);

            if (error) {
                console.error('Error fetching data:', error);
            } else if (fetchedData.length > 0) {
                const rowData = fetchedData[0];
                setData(rowData);
                const years = Object.keys(rowData).filter(key => key !== '자치구');
                setLabels(years);

                const selected2023 = parseFloat(rowData['2023']);

                const { data: totalData, error: totalError } = await supabase
                    .from('uridongne_병원수')
                    .select('*')
                    .eq('자치구', '소계');

                if (totalError) {
                    console.error('Error fetching total data:', totalError);
                } else if (totalData.length > 0) {
                    const total2023 = parseFloat(totalData[0]['2023']);
                    if (!isNaN(selected2023) && !isNaN(total2023) && total2023 > 0) {
                        const contributionPercentage = ((selected2023 / total2023) * 100).toFixed(2);
                        setContribution(`서울시 병원의 ${contributionPercentage}% 보유중`);
                    }
                }

                const startValue = parseFloat(rowData[years[0]]);
                const endValue = selected2023;
                const trendText = endValue > startValue 
                    ? '병원 수가 증가하는 추세입니다.' 
                    : '병원 수가 감소하는 추세입니다.';
                setTrend(trendText);
            }
        };

        if (selectedPolygon) {
            fetchData();
        }
    }, [selectedPolygon]);

    return (
        <div id='hospital_chart'>
            <Bar 
                data={{
                    labels: labels,
                    datasets: [{
                        label: '병원 수',
                        data: labels.map(year => data ? parseFloat(data[year]) : 0),
                        backgroundColor: trend === '병원 수가 증가하는 추세입니다.' 
                            ? 'rgba(255, 99, 132, 0.2)'
                            : 'rgba(54, 162, 235, 0.2)',
                        borderColor: trend === '병원 수가 증가하는 추세입니다.' 
                            ? 'rgba(255, 99, 132, 1)'
                            : 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                    }]
                }} 
            />
            <p>{contribution}</p>
            <p style={{ color: trend === '병원 수가 증가하는 추세입니다.' ? 'red' : 'blue' }}>{trend}</p>
        </div>
    );
};

export default App;
