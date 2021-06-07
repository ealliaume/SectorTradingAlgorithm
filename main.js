const csv = require('csv-parser');
const fs = require('fs');

const etfDirectory = 'VanguardSectorETFs';

const res = {};
const CASH = 10000.0;

fs.readdir(etfDirectory, function (err, files) {
    if (err) {
        console.log('Could not list the directory.', err);
        process.exit(1);
    }

    // Reading each csv file in folder VanguardSectorETFs
    files.forEach((file, index) => {
        fs.createReadStream(`${etfDirectory}/${file}`)
            .pipe(csv())
            .on('data', (data) => {
                const etf = file.substring(0, 3);
                const date = data.Date;
                const open = data.Open;
                const close = data.Close;

                // Making a new array if this is the first piece of data on this date
                if (!res[date]) {
                    res[date] = [];
                }

                // filter on 2021 only
                if (date.includes('2021') > 0) {
                  res[date].push({name: etf, open: open, close: close});
                }
            })
            .on('end', () => {
                // Run mainFunction() after reading the last file
                if (index == files.length - 1) {
                    mainFunction();
                }
            });
    });
});

function mainFunction() {
    const bestPerformers = [];
    Object.keys(res)
        .sort()
        .forEach((date, index) => {
            let bestPerformance = Number.NEGATIVE_INFINITY;
            let bestEtf = '';
            res[date].forEach((etf) => {
                const etfPerformance = (etf.close - etf.open) / etf.open;
                if (etfPerformance > bestPerformance) {
                    bestEtf = etf.name;
                    bestPerformance = etfPerformance;
                }
            });
            bestPerformers.push(bestEtf);
        });

    const worstPerformers = [];
    Object.keys(res)
        .sort()
        .forEach((date, index) => {
            let worstPerformance = Number.POSITIVE_INFINITY;
            let worstEtf = '';
            res[date].forEach((etf) => {
                const etfPerformance = (etf.close - etf.open) / etf.open;
                if (etfPerformance < worstPerformance) {
                    worstEtf = etf.name;
                    worstPerformance = etfPerformance;
                }
            });
            worstPerformers.push(worstEtf);
        });

    const performance = [];
    let cash = CASH;
    Object.keys(res)
        .sort()
        .forEach((date, index) => {
            if (index != 0) {
                res[date].forEach((etf) => {
                    if (etf.name == bestPerformers[index - 1]) {
                        cash = cash * (1 + (etf.open - etf.close) / etf.close);
                        performance.push((etf.open - etf.close) / etf.close);
                    }
                });
            }
        });

    let total = 0;
    for (let i = 0; i < performance.length; i++) {
        total += performance[i];
    }
    const avg = total / performance.length;
    const tradingDays = performance.length;
    const annualizedReturn = (1 + avg) ** 253 - 1;

    /*
      Average daily rate = 0.08774690684042068%
      Number of trading days = 4366
      Annualized return = 24.84494387511409%
      1000 on January 30, 2005 would equal 31829.94540714155 on June 6, 2021
      Standard deviation = 0.013087711662769837
      Performance on the worst trading day -9.825416558076196%
    */
    console.log(`Average daily rate = ${avg * 100}%`);
    console.log(`Number of trading days = ${tradingDays}`);
    console.log(`Annualized return = ${annualizedReturn * 100}%`);
    console.log(`${CASH} invested would equal ${cash} on the timeframe`);
    console.log(`Standard deviation = ${calculateStandardDeviation(performance)}`);
    console.log(`Performance on the best trading day ${bestDayPerformance(performance) * 100}%`);
    console.log(`Performance on the worst trading day ${worstDayPerformance(performance) * 100}%`);
}

function calculateStandardDeviation(performance) {
    let total = 0;
    for (const key in performance)
        total += performance[key];
    const meanVal = total / performance.length;

    let sdPrep = 0;
    for (const key in performance)
        sdPrep += Math.pow(parseFloat(performance[key]) - meanVal, 2);
    const sdResult = Math.sqrt(sdPrep / performance.length);
    return sdResult;
}

function bestDayPerformance(performance) {
    return Math.max(...performance);
}

function worstDayPerformance(performance) {
    return Math.min(...performance);
}
