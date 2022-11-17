import dotenv from 'dotenv';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import {mkdirs as makeDirectory} from './FileHelper.js';
import {join,resolve} from 'path';

//설정 파일 내용 가져오기
dotenv.config({path:join(resolve(),".env")});

makeDirectory(process.env.LOG_PATH);


//로그가 출력될 형식 지정
const {combine,timestamp,printf,splat,simple} = winston.format;

// winston 객체 만들기
const logger = winston.createLogger({
    //로그의 전반적인 형식
    format:combine(
        timestamp({
            //날짜 형식은 dayjs참고
            //format : 'YYYY-MM-DD HH:mm:ss'
            format: 'YY/MM/DD HH:mm:ss SSS'
        }),
        printf((info)=> {
            return `${info.timestamp} [${info.level}]: ${info.message}`;
        }),
        splat()
    ),
    //일반 로그 규칙 정의
    transports: [
        //하루에 하나씩 파일 형태로 기록하기 위한 설정
        new winstonDaily({
            name: 'log',
            level: process.env.LOG_LEVEL,  //출력할 로그의 수준
            datePattern: 'YYMMDD',   //파일 이름에 표시될 날짜 형식
            dirname: process.env.LOG_PATH, //파일이 저장될 위치
            filename: 'log_%DATE%.log', //파일이름 형식, %DATE%는 datePattern의 값
            maxsize: 50000000,
            maxFiles:50,
            zippedArchive:true
        })
    ]
});

//콘솔 설정
//프로덕션 버젼 (상용화 버전) 이 아니라면? 
if (process.env.NODE_ENV !== 'production') {
    logger.add (
        new winston.transports.Console({
            prettyPrint:true,
            showLevel: true,
            level: process.env.LOG_LEVEL,
            format: combine(
                winston.format.colorize(),
                printf((info)=> {
                    return `${info.timestamp} [${info.level}]: ${info.message}`;
                })
            ),
        })
    );
}

//생성한 로그 객체 내보내기
export default logger;