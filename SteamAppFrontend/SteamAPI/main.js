const https = require('https')
const axios = require('axios')
const RSA = require('./rsa.js')

class steamApiClient {
    constructor() {
        this.steamBaseUrl = "https://steamcommunity.com/"
        this.steamLoginEndpoint = "login"
        this.steamGetRsaKeyEndpoint = "login/getrsakey"
        this.steamDoLoginEndpoint = "login/dologin/"
    }

    async checkAccountValidity(username, password) {
        async function makeRequest(url, method, postData = {}) {
            let promise = new Promise((resolve, reject) => {
                if (method == "GET") {
                    https.get(url, res => {
                        let chunksOfData = [];
                        res.on("data", function (chunk) {
                            chunksOfData.push(chunk);
                        });
                        res.on('end', () => {
                            resolve(Buffer.concat(chunksOfData).toString());
                        })
                    })
                } else if (method == "POST") {
                    axios.post(url, postData).then(res => {
                        resolve(res.data);
                    })
                }
            })
            return await promise;
        }

        let response = await makeRequest("https://steamcommunity.com/" + this.steamLoginEndpoint, "GET");
        let g_sessionID = response.slice(response.search("g_sessionID") + 15, response.search("g_sessionID") + 39);

        response = await makeRequest(this.steamBaseUrl + this.steamGetRsaKeyEndpoint + `?username=${username}`, "POST");

        let rsaTimestamp = response.timestamp;

        let pubKey = RSA.RSA.getPublicKey(response.publickey_mod, response.publickey_exp);
        let rgParameters = `{
                password: encryptedPassword,
                username: username,
                twofactorcode: authCode,
                emailauth: form.elements['emailauth'] ? form.elements['emailauth'].value : '',
                loginfriendlyname: form.elements['loginfriendlyname'] ? form.elements['loginfriendlyname'].value : '',
                captchagid: this.m_gidCaptcha,
                captcha_text: form.elements['captcha_text'] ? form.elements['captcha_text'].value : '',
                emailsteamid: this.m_steamidEmailAuth,
                rsatimestamp: results.timestamp,
                remember_login: ( form.elements['remember_login'] && form.elements['remember_login'].checked ) ? 'true' : 'false'
                        , tokentype: this.m_unRequestedTokenType
                    }`;
    }
}

module.exports = steamApiClient
