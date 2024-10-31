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

        // 선택된 자치구의 2023년 유치원 수
        const selected2023 = parseFloat(rowData['2023']); // 2023년 데이터로 수정
        
        // '소계' 행의 2023년 데이터 가져오기
        const { data: totalData, error: totalError } = await supabase
          .from('uridongne_유치원수')
          .select('*')
          .eq('자치구', '소계');
        
        if (totalError) {
          console.error('Error fetching total data:', totalError);
        } else if (totalData.length > 0) {
          const total2023 = parseFloat(totalData[0]['2023']); // 2023년 데이터로 수정
          
          // 유효한 숫자인지 확인하고 비율 계산
          if (!isNaN(selected2023) && !isNaN(total2023) && total2023 > 0) {
            const contributionPercentage = ((selected2023 / total2023) * 100).toFixed(2);
            setContribution(`${contributionPercentage}%`);
          } else {
            setContribution('유효한 2023년 데이터가 없습니다.');
          }
        }

        // 모든 자치구의 유치원 수 가져오기
        const allData = await fetchAllKindergartens();
        const allKindergartens = allData.map(row => parseFloat(row['2023'])).filter(num => !isNaN(num));
        
        // 상위 50% 계산
        const sortedData = [...allKindergartens].sort((a, b) => b - a); // 내림차순 정렬
        const fiftyPercentIndex = Math.floor(sortedData.length * 0.5);
        const fiftyPercentValue = sortedData[fiftyPercentIndex];

        // 메시지 설정
        if (selected2023 > fiftyPercentValue) {
          setMessage('유치원 수가 많습니다.');
        } else {
          setMessage('유치원 수가 평균 이하입니다.');
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
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div id='kinder_chart'>
      <Bar data={chartData} />
      <p></p>
      <p>전체 유치원 수의 {contribution}만큼의 유치원 수를 보유하고 있으며 {message}</p> {/* 메시지 출력 */}
    </div>
  );
};

export default App;
