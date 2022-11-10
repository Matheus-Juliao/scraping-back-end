const db = require("./db");
const puppeteer = require('puppeteer');

const insertPeriod = async () => {
    let codigo = [];
    let mes = [];

    let value = [];
    let brand = [];

    let result = await searchBrand();

    for(let res of result.period){ codigo.push(res.Value)}
    for(let res of result.period){ mes.push(res.Label)}

    for(let res of result.brands){ value.push(res.Value)}
    for(let res of result.brands){ brand.push(res.Label)}

    let cont = 1;

    for(let i=codigo.length-1; i>=0; i--) {
        await db.insertPeriodDb(codigo[i], mes[i], (cont));
        cont++;
    }

    for(let i=0; i<brand.length; i++) {
        db.insertBrandDb(value[i], brand[i], codigo[0]);
    }
}

const searchBrand = async () => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    
    const period = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectTabelaReferenciacarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });

    const brands = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectMarcacarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });

    await browser.close();

    //Delete first item array
    brands.shift();

    return { "period": period, "brands": brands };
}

module.exports = {
    insertPeriod
}