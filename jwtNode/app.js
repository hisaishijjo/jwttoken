import logger from './helper/LogHelper.js';
import WebHelper from './helper/WebHelper.js';
import {myip,urlFormat} from './helper/UtilHelper.js';

import url from 'url';
import path from 'path';


import express from 'express';              //express본체
import useragent from 'express-useragent'   //클라이언트의 정보를 조회할 수 있는 기능
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

import JwtLogic from './JwtLogic.js';

//여기서 생성한 app객체의 use()함수를 사용해서
//각종 외부 기능, 설정내용,url을 계속해서 확장하는 형태로 구현이 진행된다.
const app = express();

//프로젝트 폴더위치
const __dirname = path.resolve();

//설정 파일 내용 가져오기
dotenv.config({path:path.join(__dirname,'./.env')});


//3. 클라이언트의 접속시 초기화
//app 객체에 useragent모듈을 탑재
//express객체(app)에 추가되는 확장 기능들을 express에서는 미들웨어라고 부른다
//useragent 모듈은 초기화 콜백함수에 전달되는 req,res객체를 확장하기 때문에 다른 모듈들보다 먼저 설정되어야한다
app.use(useragent.express());

//클라이언트의 접속을 감지
app.use((req,res,next)=> {
    logger.debug('클라이언트가 접속했습니다.');

    //클라이언트가 접속한 시간
    const beginTime = Date.now();

    //클라이언트의 ip주소(출처:스택오버플로우)
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

    //클라이언트의 디바이스 정보 기록 (userAgent)사용
    logger.debug(`[client] ${ip} / ${req.useragent.os} / ${req.useragent.browser} (${req.useragent.version}) / ${req.useragent.platform}`);

    //클라이언트가 요청한 페이지 url
    //콜백함수에 전달되는 req파라미터는 클라이언트가 요청한 url의 각 부분을 변수로 담고 있다
    const current_url = urlFormat({
        protocol: req.protocol,         //ex)http://
        host: req.get('host'),          //ex)172.16.141.1
        port: req.port,                 //ex)3000
        pathname: req.originalUrl,      //ex) /page1.html
    });

    logger.debug(`[${req.method}] ${decodeURIComponent(current_url)}`);

    //클라이언트의 접속이 종료된 경우의 이벤트 > 모든 응답의 전송이 완료된 경우
    res.on('finish',()=> {
        //접속 종료시간
        const endTime = Date.now();

        //이번 접속에서 클라이언트가 머문 시간 = 백엔드가 실행하는데 걸린 시간
        const time = endTime - beginTime;
        logger.debug(`클라이언트의 접속이 종료되었습니다. ::: [runtime] ${time}ms`);
        logger.debug('-------------------------------------------------')
    });

    //이 콜백함수를 종료하고 요청 url에 연결된 기능으로 제어를 넘김
    next();
});

//cors설정
app.use(cors({
    origin:'*',
    methods:['GET','POST','OPTIONS','DELETE','PUT'],
    credentials:true  //사용자 인증이 필요한 리소스(쿠키..등)접근
}));


//4. express 객체의 추가 설정

//post 파라미터 수신 모듈 설정, 추가되는 미들웨어들중 가장 먼저 설정해야함
//body-parser를 이용해 application/x-www.form-urlencoded파싱
//extended :true > 지속정사용
//extended :false > 한번만사용

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.text()); //text형식의 파라미터 수신가능
app.use(bodyParser.json());//json형식의 파라미터 수신가능

//http put,delete 전송방식 확장
//브라우저 개발사들이 put delete 방식으로 전송하는 http header이름
app.use(methodOverride('X-HTTP-METHOD'));   //microsoft
app.use(methodOverride('X-HTTP-METHOD-Override'));  //google/GData
app.use(methodOverride('X-METHOD-Override'));//IBM
//html폼에서 put ,delete로 전송할 경우 post방식을 사용하되,action 주소에 "?_method"라고 추가
app.use(methodOverride('_method'));//html form

//쿠키를 처리할 수 있는 객체 연결
//cookie-parser는 데이터를 저장,조회 할 때 암호화 처리를 동반한다
//이 때 암호화에 사용되는 key문자열을 개발자가 정해야 한다
app.use(cookieParser(process.env.COOKIE_ENCRYPT_KEY));

//WebHelper 설정
app.use(WebHelper());

app.use(JwtLogic());

// 6. 설정한 내용을 기반으로 서버 구동시작

const ip = myip();

app.listen(process.env.PORT,()=> {
    logger.debug('--------------------------------------------------');
    logger.debug('|             start Express Server                |');
    logger.debug('--------------------------------------------------');

    ip.forEach((v,i)=> {
        logger.debug(`server address => http://${v}:${process.env.PORT}`);
    });
    logger.debug('--------------------------------------------------');
})

