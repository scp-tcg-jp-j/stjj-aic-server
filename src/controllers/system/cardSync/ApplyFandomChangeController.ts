import { MainType, ObjectClass } from '../../../models/card';
import { Request, Response } from 'express';
import { upsertOne, bulkDelete } from '../../../models/services/cardCommandService';
import { currentCards } from '../../../models/services/cardQueryService';
import { validationResult, matchedData } from 'express-validator';
import { logger } from '../../../logger';

// カード追加・カード更新（1枚）
export function postUpsertOne(req: Request, res: Response) {
    logger.info(req.body);

    // バリデーション実行
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(errors);
        res.status(422).json({ errors: errors.array() }).send();
        return;
    }

    // リクエストボディからバリデーション済のデータだけ取り出す
    const raw = matchedData(req, { includeOptionals: true, locations: ['body'] });

    const cost = raw['cost'] || (raw['cost'] == 0 ? 0 : undefined);
    const attack = raw['attack'] || (raw['attack'] == 0 ? 0 : undefined);

    // カード追加・カード更新用オブジェクトの生成
    const card = {
        pageid: raw['pageid'] as number,
        name: raw['name'] as string,
        cost: cost as number,
        attack: attack as number,
        oc: (raw['oc'] || undefined) as ObjectClass,
        maintypes: raw['maintypes'] as [MainType, ...MainType[]],
        subtypes: (raw['subtypes'] || undefined) as [string, ...string[]],
        effect: (raw['effect'] || undefined) as string,
        tags: (raw['tags'] || undefined) as [string, ...string[]],
        banned: (raw['banned'] || undefined) as true,
        lastrevid: raw['lastrevid'] as number,
        page_title: (raw['page_title'] || undefined) as string,
    };

    // カード追加・カード更新の実行
    upsertOne(card).then(() => {
        res.status(200).send();
    }).catch(error => {
        logger.error(error);
        res.status(500).json({ errors: error }).send();
    })
}

// カード削除
export function postBulkDelete(req: Request, res: Response) {
    logger.info(req.body);

    // バリデーション実行
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(errors);
        res.status(422).json({ errors: errors.array() });
        return;
    }

    // リクエストボディからバリデーション済のデータだけ取り出す
    const raw = matchedData(req, { includeOptionals: true, locations: ['body'] });

    // カード削除の実行
    bulkDelete(raw['deleteTargetCardPageids']).then((deletedCardsCount) => {
        logger.info("deleted " + deletedCardsCount + " cards");
        res.status(200).send({ count: deletedCardsCount });
    }).catch(error => {
        logger.error(error);
        res.status(500).json({ errors: error }).send();
    });
}

// DBに存在するカードの一覧を取得する（pageidとlastrevidのペアだけ）
export function getCurrentCards(req: Request, res: Response) {
    currentCards().then((cards) => {
        // 結果のJSONが大きくなりそうなためログは吐かない（デバッグ用は要検討）
        res.status(200).send(cards);
    }).catch(error => {
        logger.error(error);
        res.status(500).json({ errors: error }).send();
    })
}
