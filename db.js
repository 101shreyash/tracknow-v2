import { Pool } from "pg"
import "dotenv/config"


const pool = new Pool({
    
    user : process.env.DB_user,
    password : process.env.DB_password,
    database : process.env.DB_database,
    port : Number(process.env.DB_port),
    host: process.env.DB_host
    
})


export default pool;
