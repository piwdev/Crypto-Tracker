const https = require('https');
const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Lambda function started');
    
    try {
        // 환경변수에서 DB 설정 가져오기
        const dbConfig = {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
        
        console.log(`Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        
        // CoinGecko API 호출 (간단한 테스트용)
        // console.log('Fetching data from CoinGecko API...');
        // const apiUrl = 'https://api.coingecko.com/api/v3/ping'; // 먼저 ping으로 테스트
        
        // const apiResponse = await fetchCoinGeckoData(apiUrl);
        // console.log('API Test Response:', apiResponse);
        
        // if (!apiResponse || !apiResponse.gecko_says) {
        //     throw new Error('API ping failed');
        // }
        
        // 실제 데이터 호출
        const coinsUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd';
        const coinData = await fetchCoinGeckoData(coinsUrl);
        console.log(`Received ${coinData.length} coins from API`);
        
        // PostgreSQL 연결 및 데이터 upsert
        const client = new Client(dbConfig);
        await client.connect();
        console.log('Connected to PostgreSQL');
        
        let processedCount = 0;
        const currentTime = new Date();
        
        for (const coin of coinData) {
            try {
                // 날짜 파싱
                const athDate = coin.ath_date ? new Date(coin.ath_date) : null;
                const atlDate = coin.atl_date ? new Date(coin.atl_date) : null;
                const lastUpdated = coin.last_updated ? new Date(coin.last_updated) : null;
                
                // UPSERT 쿼리
                const upsertQuery = `
                    INSERT INTO public.coins (
                        id, symbol, name, image, current_price, high_24h, low_24h,
                        price_change_24h, price_change_percentage_24h, market_cap,
                        market_cap_rank, market_cap_change_24h, market_cap_change_percentage_24h,
                        fully_diluted_valuation, total_volume, circulating_supply,
                        total_supply, max_supply, ath, ath_change_percentage, ath_date,
                        atl, atl_change_percentage, atl_date, roi, last_updated,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
                    )
                    ON CONFLICT (id) 
                    DO UPDATE SET
                        symbol = EXCLUDED.symbol,
                        name = EXCLUDED.name,
                        image = EXCLUDED.image,
                        current_price = EXCLUDED.current_price,
                        high_24h = EXCLUDED.high_24h,
                        low_24h = EXCLUDED.low_24h,
                        price_change_24h = EXCLUDED.price_change_24h,
                        price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
                        market_cap = EXCLUDED.market_cap,
                        market_cap_rank = EXCLUDED.market_cap_rank,
                        market_cap_change_24h = EXCLUDED.market_cap_change_24h,
                        market_cap_change_percentage_24h = EXCLUDED.market_cap_change_percentage_24h,
                        fully_diluted_valuation = EXCLUDED.fully_diluted_valuation,
                        total_volume = EXCLUDED.total_volume,
                        circulating_supply = EXCLUDED.circulating_supply,
                        total_supply = EXCLUDED.total_supply,
                        max_supply = EXCLUDED.max_supply,
                        ath = EXCLUDED.ath,
                        ath_change_percentage = EXCLUDED.ath_change_percentage,
                        ath_date = EXCLUDED.ath_date,
                        atl = EXCLUDED.atl,
                        atl_change_percentage = EXCLUDED.atl_change_percentage,
                        atl_date = EXCLUDED.atl_date,
                        roi = EXCLUDED.roi,
                        last_updated = EXCLUDED.last_updated,
                        updated_at = EXCLUDED.updated_at
                `;
                
                const values = [
                    coin.id,
                    coin.symbol,
                    coin.name,
                    coin.image,
                    coin.current_price,
                    coin.high_24h,
                    coin.low_24h,
                    coin.price_change_24h,
                    coin.price_change_percentage_24h,
                    coin.market_cap ? Math.round(coin.market_cap) : null,
                    coin.market_cap_rank,
                    coin.market_cap_change_24h ? Math.round(coin.market_cap_change_24h) : null,
                    coin.market_cap_change_percentage_24h,
                    coin.fully_diluted_valuation ? Math.round(coin.fully_diluted_valuation) : null,
                    coin.total_volume ? Math.round(coin.total_volume) : null,
                    coin.circulating_supply,
                    coin.total_supply,
                    coin.max_supply,
                    coin.ath,
                    coin.ath_change_percentage,
                    athDate,
                    coin.atl,
                    coin.atl_change_percentage,
                    atlDate,
                    coin.roi ? JSON.stringify(coin.roi) : null,
                    lastUpdated,
                    currentTime, // created_at
                    currentTime  // updated_at
                ];
                
                await client.query(upsertQuery, values);
                processedCount++;
                
            } catch (error) {
                console.error(`Error processing coin ${coin.id}:`, error.message);
            }
        }
        
        await client.end();
        console.log(`Successfully processed ${processedCount} coins`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully processed ${processedCount} coins`,
                processedCount: processedCount,
                timestamp: currentTime.toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
};

// CoinGecko API 호출 함수
function fetchCoinGeckoData(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Lambda-CoinGecko-Fetcher/1.0'
            },
            timeout: 30000 // 30초 타임아웃
        };
        
        const req = https.get(url, options, (res) => {
            let data = '';
            
            console.log(`Response status: ${res.statusCode}`);
            console.log(`Response headers:`, res.headers);
            
            // 상태 코드 확인
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`API Response Status: ${res.statusCode}`);
                console.log(`API Response Headers:`, res.headers);
                console.log(`API Response Body (first 500 chars):`, data.substring(0, 500));
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    console.error('JSON parsing failed. Raw response:', data);
                    reject(new Error(`JSON parsing failed: ${error.message}. Response: ${data.substring(0, 200)}`));
                }
            });
            
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}