import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

// 모든 구성 요소를 등록
Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
  const [data, setData] = useState(null); // 특정 행의 데이터를 저장
  const [labels, setLabels] = useState([]); // x축 레이블

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabase
        .from('uridongne_유치원') // 테이블 이름
        .select('*') // 모든 열을 선택
        .eq('자치구', selectedPolygon); // 선택된 구에 해당하는 행만 선택

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        console.log('Fetched data:', fetchedData); // 가져온 데이터 확인
        if (fetchedData.length > 0) {
          setData(fetchedData[0]); // 첫 번째 행의 데이터 설정
          // 모든 연도를 레이블로 설정
          setLabels(Object.keys(fetchedData[0]).filter(key => key !== '자치구')); // '자치구'를 제외한 모든 키를 레이블로 사용
        }
      }
    };

    if (selectedPolygon) {
      fetchData(); // 선택된 구가 있을 때만 데이터 가져오기
    }
  }, [selectedPolygon]); // selectedPolygon이 변경될 때마다 실행

  // y축 데이터 설정
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: '범죄율',
        data: labels.map(year => data ? parseFloat(data[year]) : 0), // 모든 연도의 데이터를 사용
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div id='kinder_chart'>
      <Bar data={chartData} />
    </div>
  );
};

export default App;
