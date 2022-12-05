//Import library
const express  = require('express');
const cors =  require('cors');
const puppeteer = require('puppeteer');
const app = express();
const db = require("./db");
const period = require("./period");
const periodAux = require("./periodAux");

//Register period actual and models period if not exist data in table
(async () =>{
    const ret = await db.selectPeriodLimit()

    if(ret[0]?.Codigo != 1) {
        await period.insertPeriod();
        console.log('Insered period')
    }
})();

//Check a new period
async function verificationPeriod() {
    await db.deletePeriodDbAux();
    await periodAux.insertPeriod();
    setTimeout(() => {
        console.log('Verification Period Loop')
        verificationPeriod() 
      }, (1000 * 1800)); //call function every 30 minutes
      //1 day have 86400 seconds (1000 * 86400)
}

verificationPeriod();

//Config port
const port = process.env.PORT || 3000;

//Config library
app.use(express.json());
app.use(cors());
app.listen(port, ()=>console.log("API rodando..."));


//End Point
app.post('/period', async function(req, res) {

    let period = req.body;
    let resp = await db.selectBrand(period.period);

    if(resp.length > 0){
        return res.send(resp);
    } else {
        let brands = await searchBrand(period);

        for(let i=0; i<brands.length; i++) {
            await db.insertBrandDb(brands[i].Value, brands[i].Label, period.period);
        }

        return res.send(brands);
    }

})

app.post('/brand', async function(req, res) {
    let payload = req.body;
    let id_Value = await db.selectIdBrand(payload.brand, payload.period);
    let model = await db.selectModel(id_Value[0][0].id_Value);

    if(model.length > 0){
        let year = await db.selectYear(id_Value[0][0].id_Value);
        return res.send({ models: model, years: year });
    } else {
        let modelsYears = await searchModel(payload);

        for(let i=0; i<modelsYears.models.length; i++) {
            await db.insertModelDb(modelsYears.models[i].Value, modelsYears.models[i].Label, id_Value[0][0].id_Value);
        }

        for(let i=0; i<modelsYears.years.length; i++) {
            await db.insertYearDb(modelsYears.years[i].Value, modelsYears.years[i].Label, id_Value[0][0].id_Value);
        }

        return res.send(modelsYears);
    } 
})

app.post('/modelyear', async function(req, res) {
    let modelYear = req.body
    
    //model
    if(modelYear.cod == 1) {
        let id = await db.selectIdBrand(modelYear.brand, modelYear.period);
        let id_Value = await db.selectIdModel(modelYear.model, id[0][0].id_Value);
        let year = await db.selectModelYear(id_Value[0][0].id_Value);
        
        if(year.length > 0) {
            return res.send({ years: year });
        } else {
            let modelsYears = await searchModelYear(modelYear);
            
            for(let i=0; i<modelsYears.years.length; i++) {
                await db.insertModelYearDb(modelsYears.years[i].Value, modelsYears.years[i].Label, id_Value[0][0].id_Value);
            }
    
            return res.send(modelsYears);
        }
    }
    //year
    if(modelYear.cod == 2) {
        let id = await db.selectIdBrand(modelYear.brand, modelYear.period);
        let id_Value = await db.selectIdYear(modelYear.year, id[0][0].id_Value);
        let model = await db.selectYearModel(id_Value[0][0].id_Value);
        
        if(model.length > 0){
            return res.send({ models: model });
        } else {
            let modelsYears = await searchModelYear(modelYear);          
        
            for(let i=0; i<modelsYears.models.length; i++) {
                await db.insertYearModelDb(modelsYears.models[i].Value, modelsYears.models[i].Label, id_Value[0][0].id_Value);
            }
    
            return res.send(modelsYears);
        }
    }
})

app.post('/fipe', async function(req, res) {
    let payload = req.body;
    let results = [];
    let i = 0;
    let previousPeriod = '';
    
    for(let period of payload.period) {
        const con = await db.confirmRegistration(payload, period);

        if(con[0]?.cod_brand == payload.brand 
            && con[0]?.cod_model == payload.model
            && con[0]?.cod_model_year == payload.year
            && con[0]?.cod_reference_month == period) {

            const query = await db.selectQueryAndVehicleTable(con[0]?.fk_id_vehicle_table)
            let result = new Object();

            result.mesdereferencia = query[0]?.reference_month;
            result.codigoFipe = query[0]?.fipe_code;
            result.marca = query[0]?.brand;
            result.modelo = query[0]?.model;
            result.anoModelo = query[0]?.model_year;
            result.autenticacao = query[0]?.authentication;
            result.dataDaConsulta = dateNow();
            result.precoMedio = parseFloat(query[0]?.average_price);
            result.precoMedio = result.precoMedio.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

            results.push(result);
            i++;

            previousPeriod = query[0]?.reference_month;

        } else {

            let resp = await fipe(payload, period);
            let result = new Object();
            let precoAux = "";

            if(resp.mesdereferencia == '') {
                break;
            }  
            else {
                result.mesdereferencia = resp.mesdereferencia;
                result.codigoFipe = resp.codigoFipe;
                result.marca = resp.marca;
                result.modelo = resp.modelo;
                result.anoModelo = resp.anoModelo;
                result.autenticacao = resp.autenticacao;
                result.dataDaConsulta = dateNow();
                precoAux = resp.precoMedio.replace("R$ ", "");
                precoAux = precoAux.replaceAll(".", "");
                precoAux = precoAux.replace(",", ".")
                result.precoMedio = parseFloat(precoAux);
                 
                i++;
        
                const key = gerarPassword();

                await db.insertVehicleTable(result, key);
                await db.insertQueryTable(result, key);
                await db.insertCodVehicleTable(payload, period, key);

                result.precoMedio = result.precoMedio.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});
                results.push(result);

                previousPeriod = resp.mesdereferencia;
            }
        }
    }

    return res.send({ result: results, previousPeriod: previousPeriod });
})

app.post('/print', async function(req, res) {
    let payload = req.body;
    let results = [];
    
    for(let period of payload.period) {
        const query = await db.selectQueryAndVehicleTablePrint(payload.brand, payload.model, payload.year, period);
        let result = new Object();

        result.mesdereferencia = query[0]?.reference_month;
        result.codigoFipe = query[0].fipe_code;
        result.marca = query[0]?.brand;
        result.modelo = query[0]?.model;
        result.anoModelo = query[0]?.model_year;
        result.autenticacao = query[0]?.authentication;
        result.precoMedio =  parseFloat(query[0]?.average_price);
        result.precoMedio = result.precoMedio.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

        results.push(result);
    }

    return res.send(results);
})

app.post('/moreExpensive', async function(_req, res) {
    let resp = await db.selectMoreExpensive();
    resp[0].consultationDate = dateNow();
    resp[0].average_price  = parseFloat(resp[0].average_price);
    resp[0].average_price = resp[0].average_price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

    return res.send(resp);
})

app.post('/cheapest', async function(_req, res) {
    let resp = await db.selectCheapest();
    resp[0].consultationDate = dateNow();
    resp[0].average_price  = parseFloat(resp[0].average_price);
    resp[0].average_price = resp[0].average_price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

    return res.send(resp);
})

app.post('/lessPowerful', async function(_req, res) {
    let resp = await db.selectLessPowerfulCar();
    resp[0].consultationDate = dateNow();
    resp[0].average_price  = parseFloat(resp[0].average_price);
    resp[0].average_price = resp[0].average_price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

    return res.send(resp);
})

app.post('/moreEconomical', async function(_req, res) {
    let resp = await db.selectMoreEconomical();
    resp[0].consultationDate = dateNow();
    resp[0].average_price  = parseFloat(resp[0].average_price);
    resp[0].average_price = resp[0].average_price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});

    return res.send(resp);
})

app.post('/lessEconomical', async function(_req, res) {
    let resp = await db.selectLessEconomical();
    resp[0].consultationDate = dateNow();
    resp[0].average_price  = parseFloat(resp[0].average_price);
    resp[0].average_price = resp[0].average_price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});
    
    return res.send(resp);
})

//Functions
const searchBrand = async (period) => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    await page.select('#selectTabelaReferenciacarro', period.period);
    
    const brands = await page.evaluate(resp => {
        return [...document.querySelectorAll('#selectMarcacarro option')].map(resp => { 
            const label = resp.textContent.split('|')[0].trim();
            const value = resp.value.split('|')[0].trim();
        
            return { "Label": `${label}`, "Value": `${value}`};
        });
    });
    
    //Delete first item array
    brands.shift();

    //await browser.close();

    return brands;
}

const searchModel = async (payload) => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://veiculos.fipe.org.br/#carro');
    await page.select('#selectTabelaReferenciacarro', payload.period);
    await page.select('#selectMarcacarro', payload.brand);

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

        const years = await page.evaluate(resp => {
            return [...document.querySelectorAll('#selectAnocarro option')].map(resp => { 
                const label = resp.textContent.split('|')[0].trim();
                const value = resp.value.split('|')[0].trim();
            
                return { "Label": `${label}`, "Value": `${value}`};
            });
        });

        years.shift();

        await browser.close();

        return { "years": years };
    }

    if(modelsYears.cod == 2) {
        await page.select('#selectMarcacarro', modelsYears.brand); 
        await page.select('#selectAnocarro', modelsYears.year);

        const models = await page.evaluate(resp => {
            return [...document.querySelectorAll('#selectAnoModelocarro option')].map(resp => { 
                const label = resp.textContent.split('|')[0].trim();
                const value = resp.value.split('|')[0].trim();
            
                return { "Label": `${label}`, "Value": `${value}`};
            });
        });
        
        //Delete first item array
        models.shift();

        await browser.close();

        return { "models": models };
    }
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

                case 3: json.codigoFipe = await results[i].value;
                break;

                case 5: json.marca = await results[i].value;
                break;

                case 7: json.modelo = await results[i].value;
                break;

                case 9: json.anoModelo = await results[i].value;
                break;

                case 11: json.autenticacao = await results[i].value;
                break;

                case 13: json.dataDaConsulta = await results[i].value;
                break;

                case 15: json.precoMedio = await results[i].value;
                break;
            }
        }
    }

    return json;
}

const dateNow = () => {
    const date = new Date;

    const days = new Array ("domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado");
    const months = new Array ("janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro");



    let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
    let hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours()

    return days[date.getDay()] + ", " + date.getDate() + " de " + months[date.getMonth()] + " de " + date.getFullYear() + " " + hours + ":" + minutes;
}

function gerarPassword() {
    return Math.random().toString(36).slice(-10);
}