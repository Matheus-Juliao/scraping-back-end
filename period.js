const db = require("./db");
const puppeteer = require('puppeteer');

const insertPeriod = async () => {
    let codigo = [];
    let mes = [];
    let result = await searchBrand();

    for(let res of result){ codigo.push(res.Value)}
    for(let res of result){ mes.push(res.Label)}

    let cont = 1;

    for(let i=codigo.length-1; i>=0; i--) {
        await db.insertPeriodDb(codigo[i], mes[i], cont);
        cont++;
    }
}

const searchBrand = async () => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    
    const brands = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectTabelaReferenciacarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });

    await browser.close();

    return brands;
}

module.exports = {
    insertPeriod
}