import redis from 'redis';
import dotenv from "dotenv";
import path from 'path';

const __dirname = path.resolve();

dotenv.config({path:path.join(__dirname,'./.env')});



const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
    legacyMode: true, // 반드시 설정 !!
 });

 redisClient.on('connect', () => {
    console.info('Redis connected!');
 });
 redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
 });
 redisClient.connect().then(); // redis v4 연결 (비동기)
 const redisCli = redisClient.v4;

export default redisClient;