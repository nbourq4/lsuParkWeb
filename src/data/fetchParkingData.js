const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


const extractPercentage = (str) => {
    const match = str.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : null;
};

const fetchParkingData = async () => {
    const url = 'https://www.lsu.edu/parking/availability.php';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const parkingData = [];

        $('.accordion-section-2').each((sectionIndex, section) => {
            const sectionName = $(section).find('h2').first().text().trim();
            $(section).find('.card').each((dayIndex, card) => {
                const dayName = $(card)
                    .find('.card-header button')
                    .text()
                    .trim()
                    .split('\n')[0];
                $(card)
                    .find('table tbody tr')
                    .each((rowIndex, row) => {
                        if (rowIndex === 0) return;
                        const tds = $(row).find('td');
                        const lotName = $(tds[0]).text().trim();
                        const lotNumber = $(tds[1]).text().trim();
                        const totalSpaces = parseInt($(tds[2]).text().trim(), 10) || 0;


                        const percentage_7am = extractPercentage($(tds[3]).text().trim());
                        const percentage_11am = extractPercentage($(tds[4]).text().trim());
                        const percentage_2pm = extractPercentage($(tds[5]).text().trim());
                        const percentage_4pm = extractPercentage($(tds[6]).text().trim());

                        if (
                            percentage_7am === null ||
                            percentage_11am === null ||
                            percentage_2pm === null ||
                            percentage_4pm === null
                        ) {
                            return;
                        }

                        const availability = {
                            time_7am: Math.round(totalSpaces * (100 - percentage_7am) / 100),
                            time_11am: Math.round(totalSpaces * (100 - percentage_11am) / 100),
                            time_2pm: Math.round(totalSpaces * (100 - percentage_2pm) / 100),
                            time_4pm: Math.round(totalSpaces * (100 - percentage_4pm) / 100),
                        };

                        let lot = parkingData.find(
                            (l) =>
                                l.lotName === lotName &&
                                l.lotNumber === lotNumber
                        );

                        if (!lot) {
                            lot = {
                                lotName,
                                lotNumber,
                                totalSpaces,
                                availability: {},
                            };
                            parkingData.push(lot);
                        }

                        lot.availability[dayName] = availability;
                    });
            });
        });

        return parkingData;
    } catch (error) {
        console.error('Error fetching parking data:', error);
        return [];
    }
};

module.exports = fetchParkingData;

if (require.main === module) {
    fetchParkingData().then((parkingData) => console.log(JSON.stringify(parkingData, null, 4)));
}

const saveDataToJsonFile = async () => {
    try {
        const parkingData = await fetchParkingData();
        const jsonContent = JSON.stringify(parkingData, null, 4);

        fs.writeFile('parkingData.json', jsonContent, 'utf8', (err) => {
            if (err) {
                console.error('An error occurred while writing JSON to file:', err);
            } else {
                console.log('JSON file has been saved.');
            }
        });
    } catch (error) {
        console.error('Failed to fetch or save parking data:', error);
    }
};

saveDataToJsonFile();
