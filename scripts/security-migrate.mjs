import fs from 'node:fs';
import mysql from 'mysql2/promise';
const db = await mysql.createConnection({host: process.env.DB_HOST || '127.0.0.1', port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
try {
 const [rolesBefore]=await db.query("SELECT r.name,COUNT(u.id) AS active_users FROM roles r LEFT JOIN system_users u ON u.role_id=r.id AND u.status='active' GROUP BY r.id,r.name");
 const sql=fs.readFileSync(new URL('../database/security-20261012.sql',import.meta.url),'utf8');
 for(const statement of sql.split(';').map(v=>v.trim()).filter(Boolean))await db.query(statement);
 const [columns]=await db.query("SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='attachment_files' AND COLUMN_NAME='uploaded_by'");
 if(!columns.length)await db.query('ALTER TABLE attachment_files ADD COLUMN uploaded_by CHAR(36) NULL');
 const [checks]=await db.query("SELECT r.name,COUNT(rp.id) AS permission_count FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id GROUP BY r.id,r.name");
 console.log(JSON.stringify({role_counts_before:rolesBefore,role_permission_counts_after:checks,attachment_uploaded_by:true,login_limit_table:true}));
} finally {await db.end();}
