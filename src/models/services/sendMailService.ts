import { getConfig } from '../../config';
import fetch from 'node-fetch';

type SendMailResult = { "state": "ok" } | { "state": "ng", "code": string }

export async function sendMail(mailTo: string, mailSubject: string, mailBody: string): Promise<SendMailResult> {
    const mailConfig = getConfig().mail;
    const gasUrl = mailConfig.gas;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({ token: mailConfig.token, mailTo: mailTo, mailSubject: mailSubject, mailBody: mailBody });
    const retv = fetch(gasUrl, { method: 'POST', headers: headers, body: body }).then((res: any) => {console.log(res);return res.json();});
    return retv;
}