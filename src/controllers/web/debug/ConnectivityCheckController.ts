import { Request, Response } from 'express'
import { upsertOne } from '../../../models/services/cardCommandService'

// 接続確認用コントローラ（GET）
export function getConnectivityCheck(req: Request, res: Response) {
    res.status(200).json(req.query).send()
}

// 接続確認用コントローラ（POST）
export function postConnectivityCheck(req: Request, res: Response) {
    res.status(200).json(req.body).send()
}