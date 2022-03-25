import { Request, Response } from 'express';
import { accountDb } from '../../../dao';
import bcrypt from "bcrypt";

// 接続確認用コントローラ（GET）
export function getConnectivityCheck(req: Request, res: Response) {

    res.status(200).json({ result: (req.session as any).userId ? "セッション有効" : "セッション無効" }).send();

    /*
    const users: any[] = [];
    // 実験用コードここから
    for (let index = 0; index < 35; index++) {
        users.push({
            "username": "user" + index,
            "email": "stjj+u" + index + "@kokosema.net",
            "password": bcrypt.hashSync("password" + index, 10),
            "role": index % 4 == 0 ? "administrator" : "user",
            "banned": index % 7 == 0 ? true : false,
            "created": Date.now()
        })
    }

    console.log("到達")
    accountDb.insert(users, function() {
        accountDb.persistence.compactDatafile()
        res.status(200).json(req.query).send()
    })
    */

    // ここまで

}

// 接続確認用コントローラ（POST）
export function postConnectivityCheck(req: Request, res: Response) {
    res.status(200).json(req.body).send();
}