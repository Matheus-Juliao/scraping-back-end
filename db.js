const con = require("./connection_db");

async function insertVehicleTable(results, key){
    const conn = await con.connect();
    const sql = 'INSERT INTO vehicle_table (id_vehicle_table, brand, model, model_year) VALUES (?,?,?,?)';
    const values = [key, results.marca, results.modelo, results.anoModelo];
    return conn.query(sql, values);
}

async function insertQueryTable(results, key){
    const conn = await con.connect();
    const sql = 'INSERT INTO query_table (fipe_code, reference_month, authentication, consultation_date, average_price, fk_id_vehicle_table) VALUES (?,?,?,?,?,?)';
    const values = [results.codigoFipe, results.mesdereferencia, results.autenticacao, results.dataDaConsulta, results.precoMedio, key];

    return conn.query(sql, values);
}

async function insertCodVehicleTable(payload, period, key){
    const conn = await con.connect();
    const sql = 'INSERT INTO cod_vehicle_table (cod_brand, cod_model, cod_model_year, cod_reference_month, fk_id_vehicle_table) VALUES (?,?,?,?,?)';
    const values = [payload.brand, payload.model, payload.year, period, key];
    return conn.query(sql, values);
}

async function insertPeriodDb(Codigo, Mes, seq){
    const conn = await con.connect();
    const sql = 'INSERT INTO period (Codigo, Mes, seq) VALUES (?,?,?)';
    const values = [Codigo, Mes, seq];
    return conn.query(sql, values);
}

async function insertBrandDb(Value, Label, period){
    const conn = await con.connect();
    const sql = 'INSERT INTO brands (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, period];
    return conn.query(sql, values);
}

async function insertModelDb(Value, Label, fk_id_Value){
    const conn = await con.connect();
    const sql = 'INSERT INTO models (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, fk_id_Value];
    return conn.query(sql, values);
}

async function insertYearDb(Value, Label, fk_id_Value){
    const conn = await con.connect();
    const sql = 'INSERT INTO years (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, fk_id_Value];
    return conn.query(sql, values);
}

async function insertModelYearDb(Value, Label, fk_id_Value){
    const conn = await con.connect();
    const sql = 'INSERT INTO modelYear (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, fk_id_Value];
    return conn.query(sql, values);
}

async function insertYearModelDb(Value, Label, fk_id_Value){
    const conn = await con.connect();
    const sql = 'INSERT INTO yearModel (Value, Label, fk_id_Value) VALUES (?,?,?)';
    const values = [Value, Label, fk_id_Value];
    return conn.query(sql, values);
}

async function confirmRegistration(payload, period){
    const conn = await con.connect();
    const sql = 'SELECT fk_id_vehicle_table, cod_brand, cod_model, cod_model_year, cod_reference_month FROM cod_vehicle_table WHERE cod_brand = ? AND cod_model = ? AND cod_model_year = ? AND cod_reference_month = ?';
    const values = [payload.brand, payload.model, payload.year, period];
    const [resp] = await conn.query(sql, values);
    
    return resp;
}

async function selectBrand(period){
    const conn = await con.connect();
    const sql = 'SELECT Value, Label FROM brands WHERE fk_id_Value = ?';
    const values = [period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectModel(brand){
    const conn = await con.connect();
    const sql = 'SELECT Value, Label FROM models where fk_id_Value = ?';
    const values = [brand];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectYear(brand){
    const conn = await con.connect();
    const sql = 'SELECT Value, Label FROM years where fk_id_Value = ?';
    const values = [brand];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectLabelYear(Value){
    const conn = await con.connect();
    const sql = 'SELECT Label FROM years WHERE Value = ?';
    const values = [Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectIdModel(Value){
    const conn = await con.connect();
    const sql = 'SELECT id_Value FROM models WHERE Value = ?';
    const values = [Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}

// async function selectIdBrand(Value, period){
//     const conn = await con.connect();
//     const sql = 'SELECT id_Value FROM brands WHERE Value = ? AND fk_id_Value = ?';
//     const values = [Value, period];

//     const [resp] = await conn.query(sql, values)

//     return resp;
// }



async function selectModelYear(model){
    const conn = await con.connect();
    const sql = 'SELECT modelYear.Value, modelYear.Label FROM modelYear INNER JOIN models ON models.id_Value = modelYear.fk_id_value WHERE models.Value = ?';
    const values = [model];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectYearModel(Value){
    const conn = await con.connect();
    const sql = 'SELECT models.Value, models.Label FROM models INNER JOIN yearModel ON yearModel.fk_id_Value = models.id_Value WHERE yearModel.Value = ?';
    const values = [Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}


async function selectQueryAndVehicleTable(id_cod_vehicle_table){
    const conn = await con.connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, consultation_date, average_price  FROM vehicle_table INNER JOIN query_table ON fk_id_vehicle_table = id_vehicle_table WHERE id_vehicle_table = ?';
    const values = [id_cod_vehicle_table];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectQueryAndVehicleTablePrint(period){
    const conn = await con.connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, consultation_date, average_price FROM vehicle_table INNER JOIN cod_vehicle_table ON cod_vehicle_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table INNER JOIN query_table ON query_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table WHERE cod_vehicle_table.cod_reference_month = ?';
    const values = [period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectPeriodLimit(){
    const conn = await con.connect();
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
    insertModelDb,
    insertYearDb,
    insertModelYearDb,
    insertYearModelDb,
    confirmRegistration,
    selectBrand,
    selectModel,
    selectYear,
    selectIdModel,
    // selectIdBrand,
    selectLabelYear,
    selectModelYear,
    selectYearModel,
    selectQueryAndVehicleTable,
    selectQueryAndVehicleTablePrint,
    selectPeriodLimit
};
