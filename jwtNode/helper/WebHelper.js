import logger from './LogHelper.js';

const WebHelper = ()=> {

    return (req,res,next) => {
        //express의 req,res의 기능을 확장
        //req.foo = () => {...};
        //req.bar = () => {...};

        //GET,URL,POST,PUT,DELETE 파라미터를 수신하여 값을 리턴하는 함수
        req._getParam = (method,key,def = null)=> {
            //파라미터를 http 전송방식에 따라 받는다
            let value = null;

            //1) undefined인 경우 def값으로 대체
            //>>>파라미터를 받지만 빈 문자열이거나 공백으로만 구성된 경우는 걸러내지 못한다
            if (method.toUpperCase() ==='GET') {
                value = req.query[key] || req.params[key] || def;
            }else {
                value = req.body[key] || def;
            }

            if (value ===undefined) {
                value = def;
            }

            //빈 문자열이거나 공백인 경우 걸러내기
            if (value !== null && typeof value == 'string') {
                value = value.trim();

                if (value.length === 0) {
                    value = def;
                }
            }

            logger.debug('[HTTP %s Params] %s=%s',method,key,value);
            return value;
        };

        //get 파라미터 수신 함수 --> _get_param 함수를 호출한다
        req.get = function(key,def) {
            return this._getParam('GET',key,def);
        };

        //post 파라미터 수신 함수 --> _get_param 함수를 호출한다
        req.post = function(key,def) {
            return this._getParam('POST',key,def);
        };
        //put 파라미터 수신 함수 --> _get_param 함수를 호출한다
        req.put = function(key,def) {
            return this._getParam('PUT',key,def);
        };
        //delete 파라미터 수신 함수 --> _get_param 함수를 호출한다
        req.delete = function(key,def) {
            return this._getParam('DELETE',key,def);
        };

        //프론트엔드에게 json결과를 출력하는 기능
        res._sendResult = (statusCode,message,data=null)=> {
            /**
             * {
             *      rt:결과코드 (200,400,500)..
             *      rtmsg: 결과메세지 (200인경우 ok,그 외의 경우는 error내용 >프론트가 alert로 사용자에게 제시할 목적)
             *      data: [
             *            ... JSON데이터...
             *       ]
             *      pubdate: 생성일시
             * }        
             */
            const json = {
                rt: statusCode ||200,
                rtmsg:message || 'OK'
            };

            if (data) {
                //수정 전
                //json.data = data;
                //수정 후
                for (const item in data) {
                    json[item] = data[item];
                }

            }
            console.debug(json);

            //표준시로부터 한국의 시차를 적용하여 ISO 포멧을 생성
            const offset = new Date().getTimezoneOffset() * 60000;
            const today = new Date(Date.now() - offset);
            json.pubdate = today.toISOString();

            res.header('Content-Type','application/json; charset=utf-8');
            res.header('message',encodeURIComponent(json.rtmsg));
            res.status(json.rt).send(json);
        };

        //결과가 200(OK)인 경우에 대한 JSON출력
        res.sendResult = (data) => {
            res._sendResult(200,'OK',data);
        };

        //에러처리 출력
        res.sendError = (error) => {
            logger.error(`[${error.name}] ${error.message}`);
            logger.error(error.stack);
            if (error.statusCode == undefined) {
                error.statusCode = 500;
            }

            res._sendResult(error.statusCode, error.message);
        };

        //express의 그 다음 처리 단계로 넘어간다
        next();
    };
};

export default WebHelper;