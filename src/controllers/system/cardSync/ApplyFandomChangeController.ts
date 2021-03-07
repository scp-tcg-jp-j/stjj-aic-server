import { MainType, ObjectClass } from '../../../models/card';
import { Request, Response } from 'express'
import { upsertOne, bulkDelete } from '../../../models/services/cardCommandService'
import { validationResult, matchedData } from 'express-validator';

// カード追加・カード更新（1枚）
export function postUpsertOne(req: Request, res: Response) {

    // バリデーション実行
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() }).send();
    }

    // リクエストボディからバリデーション済のデータだけ取り出す
    const raw = matchedData(req, { includeOptionals: true, locations: ['body'] })

    // カード追加・カード更新用オブジェクトの生成
    const card = {
        pageid: raw['pageid'] as number,
        name: raw['name'] as string,
        cost: (raw['cost'] || undefined) as number,
        attack: (raw['attack'] || undefined) as number,
        oc: (raw['oc'] || undefined) as ObjectClass,
        maintypes: raw['maintypes'] as [MainType, ...MainType[]],
        subtypes: (raw['subtypes'] || undefined) as [string, ...string[]],
        effect: (raw['effect'] || undefined) as string,
        tags: (raw['tags'] || undefined) as [string, ...string[]],
        banned: (raw['banned'] || undefined) as true,
        last_revid: raw['last_revid'] as number
    }

    // カード追加・カード更新の実行
    upsertOne(card).then(()=>res.status(200).send()).catch(error=>res.status(500).json({ errors: error }).send())
}

// カード削除
export function postBulkDelete(req: Request, res: Response) {

    // バリデーション実行
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // リクエストボディからバリデーション済のデータだけ取り出す
    const raw = matchedData(req, { includeOptionals: true, locations: ['body'] })

    // カード削除の実行
    bulkDelete(raw['deleteTargetCardPageids']).then((deletedCardsCount)=>res.status(200).send({ count: deletedCardsCount })).catch(error=>res.status(500).json({ errors: error }).send())
}