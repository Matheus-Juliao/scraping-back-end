async function connect(){
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection;
 
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection(
        {
            host: 'localhost',
            port: '3306',
            user: 'root',
            password: '',
            database: 'scraping'
        })

    console.log("Conectou no MySQL!");
    global.connection = connection;
    return connection;
}

async function insertVehicleTable(results, key){
    const conn = await connect();
    const sql = 'INSERT INTO vehicle_table (id_vehicle_table, brand, model, model_year) VALUES (?,?,?,?)';
    const values = [key, results.marca, results.modelo, results.anoModelo];
    return conn.query(sql, values);
}

async function insertQueryTable(results, key){
    const conn = await connect();
    const sql = 'INSERT INTO query_table (fipe_code, reference_month, authentication, consultation_date, average_price, fk_id_vehicle_table) VALUES (?,?,?,?,?,?)';
    const values = [results.codigoFipe, results.mesdereferencia, results.autenticacao, results.dataDaConsulta, results.precoMedio, key];

    return conn.query(sql, values);
}

async function insertCodVehicleTable(payload, period, key){
    const conn = await connect();
    const sql = 'INSERT INTO cod_vehicle_table (cod_brand, cod_model, cod_model_year, cod_reference_month, fk_id_vehicle_table) VALUES (?,?,?,?,?)';
    const values = [payload.brand, payload.model, payload.year, period, key];
    return conn.query(sql, values);
}

async function insertPeriodDb(Codigo, Mes, seq){
    const conn = await connect();
    const sql = 'INSERT INTO period (Codigo, Mes, seq) VALUES (?,?,?)';
    const values = [Codigo, Mes, seq];
    return conn.query(sql, values);
}

async function insertBrandDb(Value, Label, period){
    const conn = await connect();
    const sql = 'INSERT INTO brands (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, period];
    return conn.query(sql, values);
}

async function confirmRegistration(payload, period){
    const conn = await connect();
    const sql = 'SELECT fk_id_vehicle_table, cod_brand, cod_model, cod_model_year, cod_reference_month FROM cod_vehicle_table WHERE cod_brand = ? AND cod_model = ? AND cod_model_year = ? AND cod_reference_month = ?';
    const values = [payload.brand, payload.model, payload.year, period];
    const [resp] = await conn.query(sql, values);
    
    return resp;
}

async function selectBrand(period){
    const conn = await connect();
    const sql = 'SELECT Value, Label FROM brands WHERE fk_id_Value = ?';
    const values = [period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectQueryAndVehicleTable(id_cod_vehicle_table){
    const conn = await connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, consultation_date, average_price  FROM vehicle_table INNER JOIN query_table ON query_table.fk_id_vehicle_table = ?';
    const values = [id_cod_vehicle_table];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectQueryAndVehicleTablePrint(period){
    const conn = await connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, consultation_date, average_price FROM vehicle_table INNER JOIN cod_vehicle_table ON cod_vehicle_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table INNER JOIN query_table ON query_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table WHERE cod_vehicle_table.cod_reference_month = ?';
    const values = [period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectPeriodLimit(){
    const conn = await connect();
    const sql = 'SELECT Codigo FROM period LIMIT ?';
    const values = [1];

    const [resp] = await conn.query(sql, values)

    return resp;
}

//aqui exportamos tudo que desejamos usar no index.js
module.exports = { 
    insertVehicleTable, 
    insertQueryTable,
    insertCodVehicleTable,
    insertPeriodDb,
    insertBrandDb,
    confirmRegistration,
    selectBrand,
    selectQueryAndVehicleTable,
    selectQueryAndVehicleTablePrint,
    selectPeriodLimit
};
