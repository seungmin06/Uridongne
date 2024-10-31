import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import regression from 'regression';
import { Bar } from 'react-chartjs-2';

const LivabilityIndex = ({ selectedPolygon }) => {
    const [crimeData, setCrimeData] = useState([]);
    const [populationData, setPopulationData] = useState([]);
    const [hospitalData, setHospitalData] = useState([]);
    const [kindergartenData, setKindergartenData] = useState([]);
    const [academyData, setAcademyData] = useState([]);
    const [trafficAccidentData, setTrafficAccidentData] = useState([]);
    const [parkData, setParkData] = useState([]);

    const [finalScore, setFinalScore] = useState(0);

    const [predictedData, setPredictedData] = useState({
        crimeRates: [],
        populationCounts: [],
        hospitalCounts: [],
        kindergartenCounts: [],
        academyCounts: [],
        trafficAccidentCounts: [],
        parkCounts: []
    });


    useEffect(() => {
        const fetchData = async () => {
            try {
                // 범죄율 데이터 가져오기
                const { data: crimeDataResponse, error: crimeError } = await supabase
                    .from('uridongne_범죄율')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (crimeError) throw crimeError;

                // 인구수 데이터 가져오기
                const { data: populationDataResponse, error: populationError } = await supabase
                    .from('uridongne_인구수')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (populationError) throw populationError;

                // 병원수 데이터 가져오기
                const { data: hospitalDataResponse, error: hospitalError } = await supabase
                    .from('uridongne_병원수')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (hospitalError) throw hospitalError;

                // 유치원수 데이터 가져오기
                const { data: kindergartenDataResponse, error: kindergartenError } = await supabase
                    .from('uridongne_유치원수')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (kindergartenError) throw kindergartenError;

                // 학원수 데이터 가져오기
                const { data: academyDataResponse, error: academyError } = await supabase
                    .from('uridongne_학원수')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (academyError) throw academyError;

                // 교통사고 데이터 가져오기
                const { data: trafficAccidentDataResponse, error: trafficError } = await supabase
                    .from('uridongne_교통사고')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (trafficError) throw trafficError;

                // 공원수 데이터 가져오기
                const { data: parkDataResponse, error: parkError } = await supabase
                    .from('uridongne_공원')
                    .select('*')
                    .eq('자치구', selectedPolygon);

                if (parkError) throw parkError;

                setCrimeData(crimeDataResponse);
                setPopulationData(populationDataResponse);
                setHospitalData(hospitalDataResponse);
                setKindergartenData(kindergartenDataResponse);
                setAcademyData(academyDataResponse);
                setTrafficAccidentData(trafficAccidentDataResponse);
                setParkData(parkDataResponse);

                // 예측 데이터 생성
                const score = createPredictions(
                    crimeDataResponse,
                    populationDataResponse,
                    hospitalDataResponse,
                    kindergartenDataResponse,
                    academyDataResponse,
                    trafficAccidentDataResponse,
                    parkDataResponse
                );
                setFinalScore(score);
            } catch (error) {
                console.error('데이터를 가져오는 중 오류 발생:', error);
            }
        };

        fetchData();
    }, [selectedPolygon]); 


    const createPredictions = (crimeData, populationData, hospitalData, kindergartenData, academyData, trafficAccidentData, parkData) => {
        if (!crimeData.length || !populationData.length || !hospitalData.length || !kindergartenData.length || !academyData.length || !trafficAccidentData.length || !parkData.length) {
            console.error('데이터가 없습니다.');
            return;
        }

        const years = crimeData[0] && Object.keys(crimeData[0]).filter(year => !isNaN(year)).map(Number);
        const crimeRates = crimeData[0] && years.map(year => parseFloat(crimeData[0][year])).filter(rate => !isNaN(rate));
        const populationCounts = populationData[0] && years.map(year => parseFloat(populationData[0][year])).filter(count => !isNaN(count));
        const hospitalCounts = hospitalData[0] && years.map(year => parseFloat(hospitalData[0][year])).filter(count => !isNaN(count));
        const kindergartenCounts = kindergartenData[0] && years.map(year => parseFloat(kindergartenData[0][year])).filter(count => !isNaN(count));
        const academyCounts = academyData[0] && years.map(year => parseFloat(academyData[0][year])).filter(count => !isNaN(count));
        const trafficAccidentCounts = trafficAccidentData[0] && years.map(year => parseFloat(trafficAccidentData[0][year])).filter(count => !isNaN(count));

        const parkCounts = parkData[0] && years.map(year => {
            const count = parseInt(parkData[0][year], 10);
            return isNaN(count) ? 0 : count; 
        });

        if (years.length < 2 || crimeRates.length < 2 || populationCounts.length < 2 || hospitalCounts.length < 2 || kindergartenCounts.length < 2 || academyCounts.length < 2 || trafficAccidentCounts.length < 2 || parkCounts.length < 2) {
            console.error('회귀 분석을 위한 충분한 데이터가 없습니다.');
            return;
        }

        // 선형 회귀 모델 생성
        const crimeRegression = regression.linear(years.map((year, index) => [year, crimeRates[index]]));
        const populationRegression = regression.linear(years.map((year, index) => [year, populationCounts[index]]));
        const hospitalRegression = regression.linear(years.map((year, index) => [year, hospitalCounts[index]]));
        const kindergartenRegression = regression.linear(years.map((year, index) => [year, kindergartenCounts[index]]));
        const academyRegression = regression.linear(years.map((year, index) => [year, academyCounts[index]]));
        const trafficAccidentRegression = regression.linear(years.map((year, index) => [year, trafficAccidentCounts[index]]));

        const futureYears = Array.from({ length: 7 }, (_, i) => 2024 + i);
        const predictedCrimeRates = futureYears.map(year => crimeRegression.predict(year)[1]);
        const predictedPopulationCounts = futureYears.map(year => populationRegression.predict(year)[1]);
        const predictedHospitalCounts = futureYears.map(year => hospitalRegression.predict(year)[1]);
        const predictedKindergartenCounts = futureYears.map(year => kindergartenRegression.predict(year)[1]);
        const predictedAcademyCounts = futureYears.map(year => academyRegression.predict(year)[1]);
        const predictedTrafficAccidentCounts = futureYears.map(year => trafficAccidentRegression.predict(year)[1]);

        const parkRegression = regression.linear(years.map((year, index) => [year, parkCounts[index]]));
        const predictedParkCounts = futureYears.map(year => parkRegression.predict(year)[1]);


        // 최종 점수 계산
        const score = calculateLivabilityScore({
            crimeRates: predictedCrimeRates[6], 
            populationCounts: predictedPopulationCounts[6],
            hospitalCounts: predictedHospitalCounts[6],
            kindergartenCounts: predictedKindergartenCounts[6],
            academyCounts: predictedAcademyCounts[6],
            trafficAccidentCounts: predictedTrafficAccidentCounts[6],
            parkCounts: predictedParkCounts[6],

        });


        setPredictedData({
            crimeRates: predictedCrimeRates,
            populationCounts: predictedPopulationCounts,
            hospitalCounts: predictedHospitalCounts,
            kindergartenCounts: predictedKindergartenCounts,
            academyCounts: predictedAcademyCounts,
            trafficAccidentCounts: predictedTrafficAccidentCounts,
            parkCounts: predictedParkCounts
        });


        return score !== undefined ? score : 0;
    };


    const calculateLivabilityScore = (data) => {
        const weights = {
            crimeRates: 0.03,        
            populationCounts: 0.2,  
            hospitalCounts: 0.25,     
            kindergartenCounts: 0.3,
            academyCounts: 0.15,     
            trafficAccidentCounts: 0.05, 
            parkCounts: 0.05       
        };
        


        const scores = {
            crimeRates: Math.max(0, Math.min(100, 100 - data.crimeRates * 100)),
            populationCounts: Math.min(100, data.populationCounts / 1000 * 100),
            hospitalCounts: Math.min(100, data.hospitalCounts / 50 * 100),
            kindergartenCounts: Math.min(100, data.kindergartenCounts / 30 * 100),
            academyCounts: Math.min(100, data.academyCounts / 40 * 100),
            trafficAccidentCounts: Math.max(0, Math.min(100, 100 - data.trafficAccidentCounts * 5)),
            parkCounts: Math.min(100, data.parkCounts / 20 * 100)
        };

        let totalScore = 0;
        for (const key in scores) {
            totalScore += scores[key] * weights[key];
        }

        totalScore = Math.max(0, Math.min(100, totalScore)); 
        return totalScore;
    };

    const futureYears = Array.from({ length: 7 }, (_, i) => (2024 + i).toString());
    const [showPredictions, setShowPredictions] = useState(false);
    const handleScoreClick = () => {
        setShowPredictions(true);
    };

    const handleBackClick = () => {
        setShowPredictions(false);
    };
    return (
        <div>
            <div id='main_sub'>

                <h2>살만한가 지수</h2>
                {finalScore !== null && !isNaN(finalScore) ? (
                    <h3 className='score' onClick={handleScoreClick} style={{ cursor: 'pointer' }}>
                        살만지수 {finalScore.toFixed(2)}점
                    </h3>
                ) : (
                    <h3 className='score'>점수를 계산하는 중입니다...</h3>
                )}
            </div>


            <div id='pred_wrap' style={{ display: showPredictions ? 'flex' : 'none' }}>
                <span id='back' onClick={handleBackClick} style={{ cursor: 'pointer' }}>X</span>
                <p id='su'>※ 예측된 정보간의 가중치를 더해 "살만한가 지수"를 나타냅니다.</p>
                {/* 범죄율 그래프 */}
                {predictedData.crimeRates.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 범죄율',
                                    data: predictedData.crimeRates,
                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 범죄율</div>
                    </div>

                )}

                {/* 인구수 그래프 */}
                {predictedData.populationCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 인구수',
                                    data: predictedData.populationCounts,
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 인구수</div>
                    </div>

                )}
                {/* 병원수 그래프 */}
                {predictedData.hospitalCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 병원수',
                                    data: predictedData.hospitalCounts,
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 병원수</div>
                    </div>
                )}
                {/* 유치원수 그래프 */}
                {predictedData.kindergartenCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 유치원수',
                                    data: predictedData.kindergartenCounts,
                                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                                    borderColor: 'rgba(255, 206, 86, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 유치원수</div>
                    </div>
                )}
                {/* 학원수 그래프 */}
                {predictedData.academyCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 학원수',
                                    data: predictedData.academyCounts,
                                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                    borderColor: 'rgba(153, 102, 255, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 학원수</div>
                    </div>
                )}
                {/* 교통사고 그래프 */}
                {predictedData.trafficAccidentCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 교통사고',
                                    data: predictedData.trafficAccidentCounts,
                                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                                    borderColor: 'rgba(255, 159, 64, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 교통사고</div>
                    </div>
                )}
                {/* 공원수 그래프 */}
                {predictedData.parkCounts.length > 0 && (
                    <div className='chart_ddd'>
                        <Bar
                            data={{
                                labels: futureYears,
                                datasets: [{
                                    label: '예측된 공원수',
                                    data: predictedData.parkCounts,
                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                        <div>예측된 공원수</div>

                    </div>
                )}
            </div >


        </div >
    );
};

export default LivabilityIndex;
