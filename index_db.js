
//index.js
(async () => {
    const db = require("./db");
    console.log('Conectou!');
    const vihicle = await db.selectCustomers();
    console.log(vihicle);
})();



//index.js
// (async function insert(){
//     const db = require("./db");
    
//     console.log('INSERT INTO ');
//     const result = await db.insert({codigoFipe: , mesdereferencia: 18, autenticacao: "SP", dataDaConsulta, precoMedio});
    
//     console.log(result);
 
//     console.log('SELECT * FROM CLIENTES');
//     const clientes = await db.selectCustomers();
//     console.log(clientes);
// })();
