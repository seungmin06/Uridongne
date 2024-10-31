import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState([]);
  const [trend, setTrend] = useState(''); // 교통사고 추세를 설명할 텍스트

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabase
        .from('uridongne_교통사고')
        .select('*')
        .eq('자치구', selectedPolygon);

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        console.log('Fetched data:', fetchedData);
        if (fetchedData.length > 0) {
          const rowData = fetchedData[0];
          setData(rowData);
          const years = Object.keys(rowData).filter(key => key !== '자치구');
          setLabels(years);
          analyzeTrend(years.map(year => parseFloat(rowData[year])));
        }
      }
    };

    if (selectedPolygon) {
      fetchData();
    }
  }, [selectedPolygon]);

  // 교통사고 추세 분석 함수
  const analyzeTrend = (accidentData) => {
    const trendText = accidentData[accidentData.length - 1] > accidentData[0]
      ? '교통사고가 증가하는 추세입니다.'
      : '교통사고가 줄어드는 추세입니다.';
    setTrend(trendText);
  };

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: '교통사고',
        data: labels.map(year => data ? parseFloat(data[year]) : 0),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div id='traffic_chart'>
      <Bar data={chartData} />
      {trend && <p>{trend}</p>} {/* 추세 텍스트를 그래프 옆에 표시 */}
    </div>
  );
};

export default App;
