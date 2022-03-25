import { Request, Response } from 'express';

// 接続確認用コントローラ（GET）
export function getSendMail(req: Request, res: Response) {
    res.status(200).json({ 'result': 'OK' }).send();
}