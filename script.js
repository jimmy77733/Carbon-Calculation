document.addEventListener('DOMContentLoaded', () => {
    // 獲取所有需要操作的網頁元素
    const transportTypeEl = document.getElementById('transport-type');
    const distanceEl = document.getElementById('distance');
    const dietTypeEl = document.getElementById('diet-type');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveBtn = document.getElementById('save-btn');
    const resultBox = document.getElementById('result');
    const resultTextEl = document.getElementById('result-text');
    const loaderEl = document.getElementById('loader');

    // 這是一個模擬的資料庫，定義了不同選擇的碳排放因子
    // 交通：公斤 CO2e / 每公里
    // 飲食：公斤 CO2e / 每日
    const emissionFactors = {
        transport: {
            walk_bike: 0,
            public_transit: 0.04,
            scooter: 0.1,
            gas_car: 0.25,
            electric_car: 0.05,
        },
        diet: {
            vegan: 2.5,
            vegetarian: 3.2,
            omnivore_low: 5.6,
            omnivore_high: 7.2,
        }
    };

    let latestCalculationData = null; // 用來儲存最近一次的計算結果

    // --- 主要功能函式 ---

    /**
     * 核心計算函式
     * 這裡我們用 Promise 來模擬一個非同步操作，
     * 就像是把一個複雜的計算任務交給伺服器，然後等待結果。
     */
    const calculateEmissions = () => {
        return new Promise((resolve, reject) => {
            // 顯示讀取動畫，隱藏舊結果
            resultBox.classList.remove('hidden');
            loaderEl.classList.remove('hidden');
            resultTextEl.textContent = '';
            
            const transportType = transportTypeEl.value;
            const distance = parseFloat(distanceEl.value);
            const dietType = dietTypeEl.value;

            // 簡單的驗證
            if (isNaN(distance) || distance < 0) {
                reject('請輸入有效的交通里程！');
                return;
            }

            // 模擬計算需要時間（例如1.5秒）
            setTimeout(() => {
                const transportEmissions = emissionFactors.transport[transportType] * distance;
                const dietEmissions = emissionFactors.diet[dietType];
                const totalEmissions = transportEmissions + dietEmissions;

                // 將這次的輸入與結果打包成一個物件
                const data = {
                    date: new Date().toISOString(),
                    inputs: {
                        transport: transportType,
                        distance: distance,
                        diet: dietType,
                    },
                    emissions: {
                        transport: transportEmissions.toFixed(2),
                        diet: dietEmissions.toFixed(2),
                        total: totalEmissions.toFixed(2),
                    }
                };

                resolve(data); // 當計算完成，將結果傳遞出去
            }, 1500);
        });
    };

    /**
     * 將資料儲存成 JSON 檔案並觸發下載
     */
    const saveDataAsJSON = () => {
        if (!latestCalculationData) {
            alert('沒有可儲存的資料，請先進行計算！');
            return;
        }

        // 1. 將 JS 物件轉換成格式化的 JSON 字串
        const jsonString = JSON.stringify(latestCalculationData, null, 2);

        // 2. 建立一個 Blob 物件 (可以想像成一個虛擬的檔案)
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 3. 建立一個隱形的下載連結
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carbon_footprint_${new Date().toISOString().slice(0,10)}.json`; // 檔案名稱
        document.body.appendChild(a);
        
        // 4. 模擬點擊來觸發下載
        a.click();

        // 5. 清理工作：移除連結並釋放 URL 物件
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    // --- 事件監聽器 ---

    // 當「開始計算」按鈕被點擊
    calculateBtn.addEventListener('click', async () => {
        calculateBtn.disabled = true; // 防止重複點擊
        saveBtn.disabled = true;

        try {
            // 使用 await 等待非同步計算完成
            const resultData = await calculateEmissions();
            
            // 更新全域變數，讓儲存功能可以使用
            latestCalculationData = resultData;

            // 顯示結果
            resultTextEl.innerHTML = `今日預估碳排放量約為：<br><strong>${resultData.emissions.total}</strong> 公斤 CO2e`;
            saveBtn.disabled = false; // 計算完成後，才開放儲存按鈕

        } catch (error) {
            // 如果 Promise 被 reject，顯示錯誤訊息
            resultTextEl.textContent = `計算出錯：${error}`;

        } finally {
            // 無論成功或失敗，都要隱藏讀取動畫並恢復按鈕
            loaderEl.classList.add('hidden');
            calculateBtn.disabled = false;
        }
    });

    // 當「儲存紀錄」按鈕被點擊
    saveBtn.addEventListener('click', saveDataAsJSON);
});
