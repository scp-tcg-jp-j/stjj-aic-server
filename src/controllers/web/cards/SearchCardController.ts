import { Request, Response } from 'express'
import { count, find, findAll } from '../../../models/services/cardQueryService'

// カード検索コントローラ（GET）
export function postFindCards(req: Request, res: Response) {
    
    // NeDB用のクエリ
    let rootAndQuery = []
    // メインタイプ
    // todo クエリに改善の余地があるかもしれない。配列のマッチについて調べること。
    let maintypesQuery = {
        $or: (req.body.maintypes as any[]).map(maintype => ({
            maintypes: { $elemMatch: maintype }
        }))
    }
    rootAndQuery.push(maintypesQuery)
    // サブタイプ（※未入力の場合は絞り込まない）
    // todo クエリに改善の余地があるかもしれない。配列のマッチについて調べること。
    let subtypesQuery = {
        $or: (req.body.subtypes as any[]).map(subtype => ({
            subtypes: { $elemMatch: subtype }
        }))
    }
    if (subtypesQuery.$or.length != 0) {
        rootAndQuery.push(subtypesQuery)
    }

    // カード名（OR）
    if (req.body.cardName) {
        rootAndQuery.push({
            $or: (req.body.cardName as string[]).map(flagment => ({
                name: { $regex: new RegExp(escapeRegex(flagment)) },
            }))
        })
    }
    // 効果（OR）
    if (req.body.effect) {
        rootAndQuery.push({
            $or: (req.body.effect as string[]).map(flagment => ({
                effect: { $regex: new RegExp(escapeRegex(flagment)) }
            }))
        })
    }
    // 永久収容（falseの場合は永久収容カードを除く）
    if (!req.body.banned) {
        rootAndQuery.push({
            $not: {
                banned: true
            }
        })
    }
    // オブジェクト特有の項目ここから
    if ((req.body.maintypes as any[]).some(maintype => maintype == 'オブジェクト')) {
        let objectOrQuery = [] // オブジェクトでない場合にオブジェクト向けの絞り込みで弾かれるのを防ぐためのクッション
        objectOrQuery.push({ $not: { maintypes: { $elemMatch: 'オブジェクト' } } })
        let objectAndQuery = [] // オブジェクトの場合に該当すべき条件
        // OC
        if (req.body.oc) {
            objectAndQuery.push({
                oc: {
                    $in: req.body.oc
                }
            })
        }
        // 確保力（最小）
        if (req.body.attackMin ?? false) {
            objectAndQuery.push({
                attack: {
                    $gte: req.body.attackMin
                }
            })
        }
        // 確保力（最大）
        if (req.body.attackMax ?? false) {
            objectAndQuery.push({
                attack: {
                    $lte: req.body.attackMax
                }
            })
        }
        // 確保力無限大または無し
        if (!req.body.attackSpecial) {
            objectAndQuery.push({ attack: { $exists: true } })
        }
        // コスト（最小）
        if (req.body.costMin ?? false) {
            objectAndQuery.push({
                cost: {
                    $gte: req.body.costMin
                }
            })
        }
        // コスト（最大）
        if (req.body.costMax ?? false) {
            objectAndQuery.push({
                cost: {
                    $lte: req.body.costMax
                }
            })
        }
        // コスト無限大または無し
        if (!req.body.costSpecial) {
            objectAndQuery.push({ cost: { $exists: true } })
        }
        // タグ（AND）
        if (req.body.tags) {
            (req.body.tags as string[]).forEach(tag => {
                rootAndQuery.push({
                    tags: tag
                })
            });
        }

        objectOrQuery.push({ $and: objectAndQuery })
        rootAndQuery.push({ $or: objectOrQuery })
    }
    // ここまで
    let query = {
        $and: rootAndQuery
    }

    const projectionMapper = [
        { key: 1, column: "maintypes" }, 
        { key: 2, column: "subtypes" },
        { key: 3, column: "oc" },
        { key: 4, column: "attack" },
        { key: 5, column: "cost" },
        { key: 6, column: "effect" },
        { key: 7, column: "tags" },
    ]

    let projectionBase = { name: 1, page_title: 1 };
    (req.body.projections as number[]).map(key => projectionMapper.find(mapper => mapper.key == key)?.column as string).forEach(column => {
        Object.assign(projectionBase, { [column]: 1 })
    })

    const sortMapper = [
        { key: "name_asc", sort: { name: 1 } },
        { key: "attack_asc", sort: { attack: 1 } },
        { key: "cost_asc", sort: { cost: 1 } },
        { key: "name_desc", sort: { name: -1 } },
        { key: "attack_desc", sort: { attack: -1 } },
        { key: "cost_desc", sort: { cost: -1 } },
    ]

    let sort = sortMapper.find(mapper => mapper.key == req.body.sort)?.sort

    console.log("QUERIED")
    console.log(JSON.stringify(query))

    if (req.body.pageSize == '') {
        findAll(query, projectionBase, sort).then(cards => {
            count(query).then(cardCount => {
                res.status(200).json({ cards: cards, count: cardCount }).send()
            })
        })
    } else {
        const pageSize = Number.parseInt(req.body.pageSize)
        const skip = req.body.page * pageSize
        find(query, projectionBase, sort, skip, pageSize).then(cards => {
            count(query).then(cardCount => {
                res.status(200).json({ cards: cards, count: cardCount }).send()
            })
        })
    }
}

function escapeRegex(targetString: string) {
    return targetString.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&')
}