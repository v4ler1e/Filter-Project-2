const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3300;

let spareParts = [];

function clearValue(value) {
    return String(value ?? '').replaceAll('"', '').trim();
}

function toNumber(value) {
    const fixedValue = clearValue(value).replace(',', '.');
    return Number(fixedValue) || 0;
}

function getWarehouse(columns) {
    return [2, 3, 4, 5, 6].reduce((sum, index) => {
        return sum + toNumber(columns[index]);
    }, 0);
}

fs.readFile('LE.txt', 'utf8', (error, text) => {
    if (error) {
        console.error('Faili lugemisel tekkis viga:', error);
        return;
    }

    const rows = text.split('\n');

    spareParts = rows
        .filter(row => row.trim() !== '')
        .map(row => {
            const columns = row.split('\t');

            const sn = clearValue(columns[0]);
            const name = clearValue(columns[1]);
            const warehouse = getWarehouse(columns);

            // Pärast lao veerge on üks tühi veerg, seega hind tuleb järgmisest väärtusest.
            const price = toNumber(columns[8]);

            const info = {
                brand: clearValue(columns[9]) || null,
                salePrice: toNumber(columns[10])
            };

            return {
                sn,
                name,
                warehouse,
                price,
                info
            };
        });

    console.log(`Laetud ${spareParts.length} varuosa.`);
});

app.get('/spare-parts', (req, res) => {
    let results = [...spareParts];

    if (req.query.name) {
        const nameText = req.query.name.toLowerCase();
        results = results.filter(part => part.name.toLowerCase().includes(nameText));
    }

    if (req.query.sn) {
        const snText = req.query.sn.toLowerCase();
        results = results.filter(part => part.sn.toLowerCase().includes(snText));
    }

    if (req.query.sort) {
        let sortBy = req.query.sort;
        let reverse = false;

        if (sortBy.startsWith('-')) {
            reverse = true;
            sortBy = sortBy.slice(1);
        }

        results.sort((a, b) => {
            const valueA = a[sortBy];
            const valueB = b[sortBy];

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return reverse ? valueB - valueA : valueA - valueB;
            }

            return reverse
                ? String(valueB).localeCompare(String(valueA))
                : String(valueA).localeCompare(String(valueB));
        });
    }

    const page = Number(req.query.page) || 1;
    const limit = 30;
    const start = (page - 1) * limit;
    const data = results.slice(start, start + limit);

    res.json({
        totalFound: results.length,
        currentPage: page,
        data
    });
});

app.listen(PORT, () => {
    console.log(`Server töötab aadressil http://localhost:${PORT}`);
});
