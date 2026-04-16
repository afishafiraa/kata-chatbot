import mysql from 'mysql2/promise';

let pool;

export async function getPool(config) {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  return pool;
}

export async function initializeDatabase(config) {
  const connectionPool = await getPool(config);

  await connectionPool.execute(`
    CREATE TABLE IF NOT EXISTS bot_users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      telegram_user_id VARCHAR(100) NOT NULL,
      telegram_sender_name VARCHAR(255) NULL,
      full_name VARCHAR(255) NOT NULL,
      channel_type VARCHAR(50) NOT NULL DEFAULT 'telegram',
      registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_telegram_user_id (telegram_user_id)
    )
  `);
}

export async function upsertUser(config, user) {
  const connectionPool = await getPool(config);

  await connectionPool.execute(
    `
      INSERT INTO bot_users (
        telegram_user_id,
        telegram_sender_name,
        full_name,
        channel_type
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telegram_sender_name = VALUES(telegram_sender_name),
        full_name = VALUES(full_name),
        channel_type = VALUES(channel_type),
        last_seen_at = CURRENT_TIMESTAMP
    `,
    [
      user.telegramUserId,
      user.telegramSenderName,
      user.fullName,
      user.channelType
    ]
  );

  const [rows] = await connectionPool.execute(
    `
      SELECT
        id,
        telegram_user_id AS telegramUserId,
        telegram_sender_name AS telegramSenderName,
        full_name AS fullName,
        channel_type AS channelType,
        registered_at AS registeredAt,
        last_seen_at AS lastSeenAt
      FROM bot_users
      WHERE telegram_user_id = ?
      LIMIT 1
    `,
    [user.telegramUserId]
  );

  return rows[0];
}

export async function listUsers(config, todayOnly) {
  const connectionPool = await getPool(config);

  const query = todayOnly
    ? `
        SELECT
          id,
          telegram_user_id AS telegramUserId,
          telegram_sender_name AS telegramSenderName,
          full_name AS fullName,
          channel_type AS channelType,
          registered_at AS registeredAt,
          last_seen_at AS lastSeenAt
        FROM bot_users
        WHERE DATE(CONVERT_TZ(registered_at, '+00:00', '+00:00')) = UTC_DATE()
        ORDER BY registered_at DESC
      `
    : `
        SELECT
          id,
          telegram_user_id AS telegramUserId,
          telegram_sender_name AS telegramSenderName,
          full_name AS fullName,
          channel_type AS channelType,
          registered_at AS registeredAt,
          last_seen_at AS lastSeenAt
        FROM bot_users
        ORDER BY registered_at DESC
      `;

  const [rows] = await connectionPool.query(query);
  return rows;
}
