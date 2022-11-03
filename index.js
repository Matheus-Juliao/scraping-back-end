//Import library
const express  = require('express');
const cors =  require('cors');
const puppeteer = require('puppeteer');
const app = express();
const db = require("./db");

//Config port
const port = process.env.PORT || 3000;

//Config library
app.use(express.json());
app.use(cors());
app.listen(port, ()=>console.log("API rodando..."));


//End Point
app.post('/period', async function(req, res) {

    let period = req.body;
    let brands = await searchBrand(period);

    return res.send(brands);
})

app.post('/brand', async function(req, res) {
    let brand = req.body;
    let models = await searchModel(brand);

    return res.send(models);
})

app.post('/modelyear', async function(req, res) {
    let modelYear = req.body
    let modelsYears = await searchModelYear(modelYear);

    return res.send(modelsYears);
})

app.post('/fipe', async function(req, res) {
    let payload = req.body;

    let results = [];
    let i = 0;
    
    for(let period of payload.period) {
        const con = await db.confirmRegistration(payload, period);

        if(con[0]?.cod_brand == payload.brand 
            && con[0]?.cod_model == payload.model
            && con[0]?.cod_model_year == payload.year
            && con[0]?.cod_reference_month == period) {

            const query = await db.selectQueryAndVehicleTable(con[0]?.fk_cod_vehicle_table)
            let result = new Object();

            result.mesdereferencia = query[0]?.reference_month;
            result.codigoFipe = query[0].fipe_code;
            result.marca = query[0]?.brand;
            result.modelo = query[0]?.model;
            result.anoModelo = query[0]?.model_year;
            result.autenticacao = query[0]?.authentication;
            result.dataDaConsulta = query[0]?.consultation_date;
            result.precoMedio = query[0]?.average_price;

            results.push(result);
            i++;

        } else {

            let resp = await fipe(payload, period);
            let result = new Object();

            result.mesdereferencia = resp.mesdereferencia;
            result.codigoFipe = resp.codigoFipe;
            result.marca = resp.marca;
            result.modelo = resp.modelo;
            result.anoModelo = resp.anoModelo;
            result.autenticacao = resp.autenticacao;
            result.dataDaConsulta = resp.dataDaConsulta;
            result.precoMedio = resp.precoMedio;
    
            results.push(result);
            i++;
    
            const key = gerarPassword();

            await db.insertVehicleTable(result, key);
            await db.insertQueryTable(result, key);
            await db.insertCodVehicleTable(payload, period, key);
        }
    }

    return res.send(results);
})


//Functions
const searchBrand = async (period) => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    await page.select('#selectMarcacarro', period.period);

    const brands = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectMarcacarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });
    
    //Delete first item array
    brands.shift();

    await browser.close();

    return brands;
}

const searchModel = async (brand) => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    await page.select('#selectMarcacarro', brand.brand);

    const models = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectAnoModelocarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });
    
    //Delete first item array
    models.shift();

    const years = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectAnocarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });

    years.shift();

    await browser.close();

    return { "models": models, "years": years };
}

const searchModelYear = async (modelsYears) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');

    if(modelsYears.cod == 1) {
        await page.select('#selectMarcacarro', modelsYears.brand); 
        await page.select('#selectAnoModelocarro', modelsYears.model);
    }
    if(modelsYears.cod == 2) {
        await page.select('#selectMarcacarro', modelsYears.brand); 
        await page.select('#selectAnocarro', modelsYears.year);
    }

    const models = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectAnoModelocarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });
    
    //Delete first item array
    models.shift();

    const years = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectAnocarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });

    years.shift();

    await browser.close();

    return { "models": models, "years": years };
}

const json = { 
    mesdereferencia: "",
    codigoFipe: "",
    marca: "",
    modelo: "",
    anoModelo: "",
    autenticacao: "",
    dataDaConsulta: "",
    precoMedio: ""
}

const fipe = async (payload, period) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/');
    await page.click('.ilustra a');
    await page.select('.open .inside-search select', period);
    await page.select('#selectMarcacarro', payload.brand);
    await page.select('#selectAnoModelocarro', payload.model);
    await page.select('#selectAnocarro', payload.year);
    await page.click('#buttonPesquisarcarro');

    const results = await page.evaluate(resp => {
         return [...document.querySelectorAll('#resultadoConsultacarroFiltros table tbody td p')].map((resp) => { 
            const value = resp.textContent.split('|')[0].trim();
        
            return { "value": `${ value }` };
        });
    });

    const result = await tofixedJson(results);

    await browser.close();

    return result;
}

const tofixedJson = async (results) => {
    if(results.length == 0) {
        json.mesdereferencia = "",
        json.codigoFipe = "",
        json.marca = "",
        json.modelo = "",
        json.anoModelo = "",
        json.autenticacao = "",
        json.dataDaConsulta = "",
        json.precoMedio = ""

        return json;
    } else {
        for(let i=0; i<16; i++) {

            switch(i) {
                case 1: json.mesdereferencia = await results[i].value;
                break;

                case 3: json.codigoFipe = results[i].value;
                break;

                case 5: json.marca = results[i].value;
                break;

                case 7: json.modelo = results[i].value;
                break;

                case 9: json.anoModelo = results[i].value;
                break;

                case 11: json.autenticacao = results[i].value;
                break;

                case 13: json.dataDaConsulta = results[i].value;
                break;

                case 15: json.precoMedio = results[i].value;
                break;
            }
        }
    }

    return json;
}

function gerarPassword() {
    return Math.random().toString(36).slice(-10);
}
