const con = require("./connection_db");

async function insertVehicleTable(results, key){
    const conn = await con.connect();
    const sql = 'INSERT INTO vehicle_table (id_vehicle_table, brand, model, model_year) VALUES (?,?,?,?)';
    const values = [key, results.marca, results.modelo, results.anoModelo];
    return conn.query(sql, values);
}

async function insertQueryTable(results, key){
    const conn = await con.connect();
    const sql = 'INSERT INTO query_table (fipe_code, reference_month, authentication, average_price, fk_id_vehicle_table) VALUES (?,?,?,?,?)';
    const values = [results.codigoFipe, results.mesdereferencia, results.autenticacao, results.precoMedio, key];

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

async function insertPeriodDbAux(Codigo, Mes, seq){
    const conn = await con.connect();
    const sql = 'INSERT INTO period_aux (Codigo, Mes, seq) VALUES (?,?,?)';
    const values = [Codigo, Mes, seq];
    return conn.query(sql, values);
}

async function deletePeriodDbAux(){
    const conn = await con.connect();
    const sql = 'DELETE FROM period_aux';

    return conn.query(sql);
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

async function selectIdBrand(Value, period){
    const conn = await con.connect();
    const sql = 'CALL brand(?, ?)';
    const values = [Value, period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectModel(id_Value){
    const conn = await con.connect();
    const sql = 'SELECT models.Value, models.Label FROM models INNER JOIN brands ON models.fk_id_Value = brands.id_Value WHERE models.fk_id_Value = ?';
    const values = [id_Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectIdModel(Value, fk_id_Value){
    const conn = await con.connect();
    const sql = 'CALL model(?, ?)';
    const values = [Value, fk_id_Value];

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

async function selectIdYear(Value, fk_id_Value){
    const conn = await con.connect();
    const sql = 'CALL year(?, ?)';
    const values = [Value, fk_id_Value];

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

async function selectModelYear(fk_id_Value){
    const conn = await con.connect();
    const sql = 'SELECT modelYear.Value, modelYear.Label FROM modelYear WHERE fk_id_Value = ?';
    const values = [fk_id_Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectYearModel(fk_id_Value){
    const conn = await con.connect();
    const sql = 'SELECT Value, Label FROM yearModel WHERE fk_id_Value = ?';
    const values = [fk_id_Value];

    const [resp] = await conn.query(sql, values)

    return resp;
}


async function selectQueryAndVehicleTable(id_cod_vehicle_table){
    const conn = await con.connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, average_price  FROM vehicle_table INNER JOIN query_table ON fk_id_vehicle_table = id_vehicle_table WHERE id_vehicle_table = ?';
    const values = [id_cod_vehicle_table];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectQueryAndVehicleTablePrint(brand, model, year, period){
    const conn = await con.connect();
    const sql = 'SELECT reference_month, fipe_code, brand, model, model_year, authentication, average_price FROM vehicle_table INNER JOIN cod_vehicle_table ON cod_vehicle_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table INNER JOIN query_table ON query_table.fk_id_vehicle_table = vehicle_table.id_vehicle_table WHERE cod_vehicle_table.cod_brand = ? AND cod_vehicle_table.cod_model = ? AND cod_vehicle_table.cod_model_year = ? AND cod_vehicle_table.cod_reference_month = ?';
    const values = [brand, model, year, period];

    const [resp] = await conn.query(sql, values)

    return resp;
}

async function selectPeriodLimit(){
    const conn = await con.connect();
    const sql = 'SELECT selectPeriodLimit() AS Codigo';

    const [resp] = await conn.query(sql)

    return resp;
}

async function selectMoreExpensive(){
    const conn = await con.connect();
    const sql = 'SELECT * FROM mostExpensiveCarInDatabase';

    const [resp] = await conn.query(sql)

    return resp;
}

async function selectCheapest(){
    const conn = await con.connect();
    const sql = 'SELECT * FROM cheapestCarInDatabase';

    const [resp] = await conn.query(sql)

    return resp;
}

async function selectLessPowerfulCar(){
    const conn = await con.connect();
    const sql = 'SELECT * FROM lessPowerfulCar';

    const [resp] = await conn.query(sql)

    return resp;
}

async function selectMoreEconomical(){
    const conn = await con.connect();
    const sql = 'SELECT * FROM moreEconomical';

    const [resp] = await conn.query(sql)

    return resp;
}

async function selectLessEconomical(){
    const conn = await con.connect();
    const sql = 'SELECT * FROM lessEconomical';

    const [resp] = await conn.query(sql)

    return resp;
}

//aqui exportamos tudo que desejamos usar no index.js
module.exports = { 
    insertVehicleTable, 
    insertQueryTable,
    insertCodVehicleTable,
    insertPeriodDb,
    insertPeriodDbAux,
    deletePeriodDbAux,
    insertBrandDb,
    insertModelDb,
    insertYearDb,
    insertModelYearDb,
    insertYearModelDb,
    confirmRegistration,
    selectBrand,
    selectIdBrand,
    selectModel,
    selectIdModel,
    selectYear,
    selectIdYear,
    selectLabelYear,
    selectModelYear,
    selectYearModel,
    selectQueryAndVehicleTable,
    selectQueryAndVehicleTablePrint,
    selectPeriodLimit,
    selectMoreExpensive,
    selectCheapest,
    selectLessPowerfulCar,
    selectMoreEconomical,
    selectLessEconomical
};
