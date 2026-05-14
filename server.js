// server.js
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3300;

let allParts = [];

// Ctenije dannyh iz faila i parsenie
const data = fs.readFileSync("LE.txt", "utf-8");
const lines = data.split("\n");

allParts = lines.map(line => {
    const cols = line.split("\t");

    if (cols.length < 9) return null;

    let sn = cols[0].replace(/"/g, "").trim();
    let name = cols[1].replace(/"/g, "").trim();
    let price = cols[8].replace(/"/g, "").trim();

    price = parseFloat(price.replace(",", "."));

    return { sn, name, price };
}).filter(item => item !== null);

console.log("Загружено:", allParts.length);

// Endpoint для получения запчастей с фильтрацией, сортировкой и пагинацией
app.get("/spare-parts", (req, res) => {
    let result = [...allParts];

    // Filtratsia
    if (req.query.name) {
        const search = req.query.name.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(search));
    }

    if (req.query.sn) {
        result = result.filter(p => p.sn === req.query.sn);
    }

    // Sortirovka
    if (req.query.sort) {
        let field = req.query.sort;
        let desc = false;

        if (field.startsWith("-")) {
            desc = true;
            field = field.substring(1);
        }

        result.sort((a, b) => {
            if (a[field] < b[field]) return desc ? 1 : -1;
            if (a[field] > b[field]) return desc ? -1 : 1;
            return 0;
        });
    }

    // Paginatsia
    const page = parseInt(req.query.page) || 1;
    const pageSize = 30;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    result = result.slice(start, end);

    res.json(result);
});

// Zapusk servera
app.listen(PORT, () => {
    console.log(`Server töötab: http://localhost:${PORT}`);
});