async function connect(){
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection;
 
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection(
        {
            host: 'localhost',
            port: '3306',
            user: 'root',
            password: 'jackson1500',
            database: 'fipe_scrapping'
        })

    console.log("Conectou no MySQL!");
    global.connection = connection;
    return connection;
}


async function selectCustomers(){
    const conn = await connect();
    const [rows] = await conn.query('Select * from vehicle_table');
    return rows;
}

async function insertVehicleTable(results, key){
    const conn = await connect();
    const sql = 'INSERT INTO vehicle_table (id_vehicle_table, brand, model, model_year) VALUES (?,?,?,?)';
    const values = [key, results.marca, results.modelo, results.anoModelo];
    return await conn.query(sql, values);
}

async function insertQueryTable(results, key){
    const conn = await connect();
    const sql = 'INSERT INTO query_table (fipe_code, reference_month, authentication, consultation_date, average_price, id_vehicle_table) VALUES (?,?,?,?,?,?)';
    const values = [results.codigoFipe, results.mesdereferencia, results.autenticacao, results.dataDaConsulta, results.precoMedio, key];
    return await conn.query(sql, values);
}



//aqui exportamos tudo que desejamos usar no index.js
module.exports = {insertVehicleTable, insertQueryTable};
