import { Request, Response } from 'express'
import { logger } from '../../../logger'
import { editUsers, findAllUsers } from '../../../models/services/userService'

export function postAllUsers(req: Request, res: Response) {

    findAllUsers().then(function(users) {
        logger.info("NeDBへのクエリが正常終了しました")
        res.status(200).json({ users: users }).send()
    }).catch(function(reason) {
        logger.error(reason)
        res.status(500).send()
    })

}

export function postEditUsers(req: Request, res: Response) {

    editUsers(req.body.changes).then(function(results) {
        if (results.some(result => result.status == "rejected")) {
            res.status(500).send()
        } else {
            res.status(200).json({ result: "ok" }).send()
        }
    })

}