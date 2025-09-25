document.addEventListener('DOMContentLoaded', () => {
    // 獲取所有需要操作的網頁元素
    const transportTypeEl = document.getElementById('transport-type');
    const distanceEl = document.getElementById('distance');
    const dietTypeEl = document.getElementById('diet-type');
    const electricityEl = document.getElementById('electricity');
    const waterEl = document.getElementById('water');
    const wasteEl = document.getElementById('waste');

    const calculateBtn = document.getElementById('calculate-btn');
    const saveBtn = document.getElementById('save-btn');
    const resultBox = document.getElementById('result');
    const totalResultTextEl = document.getElementById('total-result-text');
    const resultBreakdownEl = document.getElementById('result-breakdown');
    const loaderEl = document.getElementById('loader');

    const tiltContainer = document.getElementById('tilt-container');

    // 擴展後的排放因子數據庫 (單位：kg CO2e)
    const emissionFactors = {
        transport: { // per km
            walk_bike: 0,
            public_transit: 0.04,
            scooter: 0.1,
            gas_car: 0.25,
            electric_car: 0.05,
        },
        diet: { // per day
            vegan: 2.5,
            vegetarian: 3.2,
            omnivore_low: 5.6,
            omnivore_high: 7.2,
        },
        energy: { // per unit
            electricity: 0.475, // per kWh
            water: 0.001,      // per Liter
        },
        waste: { // per kg
            general: 0.5,
        }
    };

    let latestCalculationData = null;
    // --- 碳排放計算邏輯 ---
    const calculateEmissions = () => {
        return new Promise((resolve, reject) => {
            resultBox.classList.remove('hidden');
            loaderEl.classList.remove('hidden');
            totalResultTextEl.textContent = '';
            resultBreakdownEl.innerHTML = '';
            
            // 獲取所有輸入值
            const inputs = {
                transportType: transportTypeEl.value,
                distance: parseFloat(distanceEl.value) || 0,
                dietType: dietTypeEl.value,
                electricity: parseFloat(electricityEl.value) || 0,
                water: parseFloat(waterEl.value) || 0,
                waste: parseFloat(wasteEl.value) || 0
            };

            // 模擬異步計算
            setTimeout(() => {
                // 分項計算
                const transport = emissionFactors.transport[inputs.transportType] * inputs.distance;
                const diet = emissionFactors.diet[inputs.dietType];
                const electricity = emissionFactors.energy.electricity * inputs.electricity;
                const water = emissionFactors.energy.water * inputs.water;
                const waste = emissionFactors.waste.general * inputs.waste;
                
                const total = transport + diet + electricity + water + waste;

                // 準備回傳的詳細資料
                const data = {
                    date: new Date().toISOString(),
                    inputs: inputs,
                    emissions: {
                        breakdown: {
                            transport: transport,
                            diet: diet,
                            electricity: electricity,
                            water: water,
                            waste: waste,
                        },
                        total: total,
                    }
                };
                resolve(data);
            }, 1500);
        });
    };

    // --- 3D 傾斜互動效果 ---
    const TILT_AMOUNT = 8; // 傾斜角度的幅度

    tiltContainer.addEventListener('mousemove', (e) => {
        const rect = tiltContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = x - centerX;
        const deltaY = y - centerY;

        const rotateX = (deltaY / centerY) * -TILT_AMOUNT;
        const rotateY = (deltaX / centerX) * TILT_AMOUNT;

        tiltContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    tiltContainer.addEventListener('mouseleave', () => {
        tiltContainer.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });


    // --- 事件監聽器 ---
    calculateBtn.addEventListener('click', async () => {
        calculateBtn.disabled = true;
        saveBtn.disabled = true;

        try {
            const resultData = await calculateEmissions();
            latestCalculationData = resultData;


            totalResultTextEl.innerHTML = `今日預估總碳排量：<strong>${resultData.emissions.total.toFixed(2)}</strong> kg CO2e`;
            
            const breakdown = resultData.emissions.breakdown;
            resultBreakdownEl.innerHTML = `
                <li><span>🚗 交通</span> <span>${breakdown.transport.toFixed(2)} kg</span></li>
                <li><span>🍲 飲食</span> <span>${breakdown.diet.toFixed(2)} kg</span></li>
                <li><span>⚡️ 電力</span> <span>${breakdown.electricity.toFixed(2)} kg</span></li>
                <li><span>💧 水資源</span> <span>${breakdown.water.toFixed(2)} kg</span></li>
                <li><span>♻️ 廢棄物</span> <span>${breakdown.waste.toFixed(2)} kg</span></li>
            `;

            saveBtn.disabled = false;
        } catch (error) {
            totalResultTextEl.textContent = `計算出錯：${error}`;
        } finally {
            loaderEl.classList.add('hidden');
            calculateBtn.disabled = false;
        }
    });


    saveBtn.addEventListener('click', () => {
        if (!latestCalculationData) return;
        const jsonString = JSON.stringify(latestCalculationData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carbon_footprint_pro_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
});

