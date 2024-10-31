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
  const [isAboveAverage, setIsAboveAverage] = useState(false); // 유치원 수가 평균보다 많은지 여부

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabase
        .from('uridongne_유치원수')
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
          .from('uridongne_유치원수')
          .select('*')
          .eq('자치구', '소계');
        
        if (totalError) {
          console.error('Error fetching total data:', totalError);
        } else if (totalData.length > 0) {
          const total2023 = parseFloat(totalData[0]['2023']);
          
          if (!isNaN(selected2023) && !isNaN(total2023) && total2023 > 0) {
            const contributionPercentage = ((selected2023 / total2023) * 100).toFixed(2);
            setContribution(`${contributionPercentage}%`);
          } else {
            setContribution('유효한 2023년 데이터가 없습니다.');
          }
        }

        const allData = await fetchAllKindergartens();
        const allKindergartens = allData.map(row => parseFloat(row['2023'])).filter(num => !isNaN(num));
        
        const sortedData = [...allKindergartens].sort((a, b) => b - a);
        const fiftyPercentIndex = Math.floor(sortedData.length * 0.5);
        const fiftyPercentValue = sortedData[fiftyPercentIndex];

        if (selected2023 > fiftyPercentValue) {
          setMessage('유치원 수가 많습니다.');
          setIsAboveAverage(true);
        } else {
          setMessage('유치원 수가 평균 이하입니다.');
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
      .from('uridongne_유치원수')
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
        label: '유치원수',
        data: labels.map(year => data ? parseFloat(data[year]) : 0),
        backgroundColor: isAboveAverage ? 'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)', // 유치원 수가 많으면 빨간색, 적으면 파란색
        borderColor: isAboveAverage ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div id='kinder_chart'>
      <Bar data={chartData} />
      <p></p>
      <p>서울시 유치원의 {contribution} 만큼 보유중</p>
      <p style={{ color: isAboveAverage ? 'red' : 'blue' }}>{message}</p> {/* 메시지 색상 설정 */}
    </div>
  );
};

export default App;
