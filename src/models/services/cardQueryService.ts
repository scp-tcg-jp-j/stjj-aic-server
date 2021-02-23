import { cardDb, oldCardDb } from './../../dao';

// todo: コントローラ書いて繋げて動かしてみる
// カード検索（まんまNeDBのクエリが動くのであまりよろしくない）
export async function find(query: any, projection: any, sort: any, skip: number, limit: number) {
    return new Promise(
        (resolve: (cards: any[]) => any, reject: (error: Error) => any) => 
            cardDb.find(query, projection).sort(sort).skip(skip).limit(limit).exec(function (err, cards) {
                if (err) {
                    return reject(err)
                }

                return resolve(cards)
            })
    )
}