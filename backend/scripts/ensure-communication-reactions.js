const db = require('../config/db');

async function run() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS communication_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_type VARCHAR(20) NOT NULL,
      item_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_communication_reaction (item_type, item_id, user_id),
      INDEX idx_communication_item (item_type, item_id),
      INDEX idx_communication_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('communication_reactions table is ready');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
