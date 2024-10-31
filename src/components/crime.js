import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase';

Chart.register(...registerables);

const App = ({ selectedPolygon }) => {
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState([]);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [trendMessage, setTrendMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabase
        .from('uridongne_범죄율')
        .select('*')
        .eq('자치구', selectedPolygon);

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        console.log('Fetched data:', fetchedData);
        if (fetchedData.length > 0) {
          setData(fetchedData[0]);
          const years = Object.keys(fetchedData[0]).filter(key => key !== '자치구');
          setLabels(years);
          analyzeTrend(years.map(year => parseFloat(fetchedData[0][year])));
        }
      }
    };

    if (selectedPolygon) {
      fetchData();
    }
  }, [selectedPolygon]);

  const analyzeTrend = (crimeData) => {
    const isIncreasingTrend = crimeData[crimeData.length - 1] > crimeData[0];
    setIsIncreasing(isIncreasingTrend);
    setTrendMessage(isIncreasingTrend ? '범죄율이 증가하는 추세입니다.' : '범죄율이 줄어드는 추세입니다.');
  };

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: '범죄율',
        data: labels.map(year => data ? parseFloat(data[year]) : 0),
        backgroundColor: isIncreasing ? 'rgba(54, 162, 235, 0.2)' : 'rgba(255, 99, 132, 0.2)',
        borderColor: isIncreasing ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div id='crime_chart'>
      <Bar data={chartData} />
      {trendMessage && (
        <p style={{ color: isIncreasing ? 'blue' : 'red' }}>{trendMessage}</p>
      )}
    </div>
  );
};

export default App;
