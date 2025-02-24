const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Caminhos do banco de dados e do CSV
const dbPath = path.join(__dirname, "blogAndForm.sqlite"); // Ajustando para o caminho correto
const csvPath = "/var/www/html/leads.csv";

// Conectar ao banco SQLite
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco SQLite:", err.message);
  } else {
    console.log("Conectado ao banco SQLite.");
    exportToCSV();
  }
});

// Função para exportar os dados para CSV
function exportToCSV() {
  const query = "SELECT * FROM formSubmissions"; // Nome correto da tabela

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar os dados:", err.message);
      return;
    }

    if (rows.length === 0) {
      console.log("Nenhum dado encontrado.");
      return;
    }

    // Obter cabeçalhos das colunas
    const headers = Object.keys(rows[0]).join(",") + "\n";

    // Converter linhas para CSV
    const csvData = rows.map((row) => Object.values(row).join(",")).join("\n");

    // Escrever o arquivo CSV
    fs.writeFile(csvPath, headers + csvData, "utf8", (err) => {
      if (err) {
        console.error("Erro ao salvar CSV:", err.message);
      } else {
        console.log("Arquivo CSV gerado com sucesso:", csvPath);
      }
      db.close();
    });
  });
}
