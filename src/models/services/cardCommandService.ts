import { Card } from './../card';
import { cardDb, oldCardDb } from './../../dao';

// カード追加・カード更新
export async function upsertOne(card: Card) {
    return new Promise<void>((resolve, reject) => 
        cardDb.find({ pageid: card.pageid }, { _id: 0 }, function (errorOfFind, oldCard) {
            if (errorOfFind) {
                reject(errorOfFind)
            }

            // 変更用オブジェクトの生成
            const upsertSetter = card
            const upsertUnsetter = { cost: true, attack: true, oc: true, subtypes: true, effect: true, tags: true } as any
            Object.keys(card).forEach(key => delete upsertUnsetter[key])

            cardDb.update({ pageid: card.pageid }, { $set: upsertSetter, $unset: upsertUnsetter }, { upsert: true }, function (errorOfUpsert) {
                if (errorOfUpsert) {
                    reject(errorOfUpsert)
                }
                // NeDBのコンパクション実行
                cardDb.persistence.compactDatafile()
                oldCardDb.persistence.compactDatafile()
                resolve()
            })
        })
    )
}

// カード削除
export async function bulkDelete(deleteTargetCardPageids: number[]) {
    return new Promise((resolve: (deletedCardsCount: number) => any, reject: (error: Error) => any) => 
        // 削除対象のカードを抽出
        cardDb.find({ pageid: { $in: deleteTargetCardPageids } }).exec(function (errorOfFind, cardsToDelete) {
            if (errorOfFind) {
                reject(errorOfFind)
            }
            // _idを_id_oldに変更（旧カード用DBでの重複を避けるため）
            cardsToDelete.forEach(oldCard => {
                oldCard._id_old = oldCard._id
                delete oldCard._id
            })
            // 旧カード用DBに投入
            oldCardDb.insert(cardsToDelete, function (errorOfInsert) {
                if (errorOfInsert) {
                    reject(errorOfInsert)
                }
                // 現カード用DBから削除
                cardDb.remove({ pageid: { $in: cardsToDelete.map(oldCard => oldCard.pageid) } }, { multi: true }, function (errorOfDelete, deletedCardsCount) {
                    if (errorOfDelete) {
                        reject(errorOfDelete)
                    }
                    // NeDBのコンパクション実行
                    cardDb.persistence.compactDatafile()
                    oldCardDb.persistence.compactDatafile()
                    resolve(deletedCardsCount)
                })
            })
        })
    )
}