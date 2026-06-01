const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3300;

let spareParts = [];

function cleanValue(value) {
    return String(value ?? "").replaceAll('"', "").trim();
}

function toNumber(value) {
    const cleaned = cleanValue(value).replace(",", ".");
    return Number(cleaned) || 0;
}

function makePart(columns) {
    const sn = cleanValue(columns[0]);
    const name = cleanValue(columns[1]);

    const warehouses = {
        Tallinn: toNumber(columns[2]),
        Maardu: toNumber(columns[3]),
        Tartu: toNumber(columns[4]),
        Parnu: toNumber(columns[5]),
        Paldiski: toNumber(columns[6])
    };

    const warehouse =
        warehouses.Tallinn +
        warehouses.Maardu +
        warehouses.Tartu +
        warehouses.Parnu +
        warehouses.Paldiski;

    const price = toNumber(columns[8]);

    const info = {
        brand: cleanValue(columns[9]),
        salePrice: toNumber(columns[10])
    };

    return {
        sn,
        name,
        warehouse,
        warehouses,
        price,
        info
    };
}

fs.readFile("LE.txt", "utf8", (error, data) => {
    if (error) {
        console.error("File reading error:", error);
        return;
    }

    const lines = data.split("\n");

    spareParts = lines
        .filter(line => line.trim() !== "")
        .map(line => line.split("\t"))
        .filter(columns => columns.length >= 11)
        .map(makePart);

    console.log(`Loaded ${spareParts.length} spare parts`);
});

app.get("/spare-parts", (req, res) => {
    let results = [...spareParts];

    if (req.query.name) {
        const searchName = req.query.name.toLowerCase();
        results = results.filter(part =>
            part.name.toLowerCase().includes(searchName)
        );
    }

    if (req.query.sn) {
        const searchSn = req.query.sn.toLowerCase();
        results = results.filter(part =>
            part.sn.toLowerCase().includes(searchSn)
        );
    }

    if (req.query.city) {
        const city = req.query.city;
        results = results.filter(part =>
            part.warehouses[city] !== undefined && part.warehouses[city] > 0
        );
    }

    if (req.query.sort) {
        let sortField = req.query.sort;
        let isDescending = false;

        if (sortField.startsWith("-")) {
            isDescending = true;
            sortField = sortField.substring(1);
        }

        results.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (typeof valueA === "number" && typeof valueB === "number") {
                return isDescending ? valueB - valueA : valueA - valueB;
            }

            valueA = String(valueA ?? "");
            valueB = String(valueB ?? "");

            return isDescending
                ? valueB.localeCompare(valueA)
                : valueA.localeCompare(valueB);
        });
    }

    const page = Number(req.query.page) || 1;
    const limit = 30;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
        totalFound: results.length,
        currentPage: page,
        data: paginatedResults
    });
});

app.listen(PORT, () => {
    console.log(`Server is running: http://localhost:${PORT}`);
});
