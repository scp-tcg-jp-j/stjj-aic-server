import { Card } from './../card';
import { cardDb, oldCardDb } from './../../dao';

// カード追加・カード更新
export async function upsertOne(card: Card) {
    return new Promise<void>((resolve, reject) => 
        cardDb.find({ pageid: card.pageid }).exec(async function (errorOfFind, oldCard: any) {
            if (errorOfFind) {
                return reject(errorOfFind)
            }

            // カード更新の場合は_idを_id_oldに変更（旧カード用DBでの重複を避けるため）
            // _idを_id_oldに変更（旧カード用DBでの重複を避けるため）
            if (oldCard) {
                oldCard._id_old = oldCard._id
                delete oldCard._id
                // 旧カード用DBに投入
                const archiveOldResult = await archiveOld(oldCard).catch((reason) => reason)
                if (archiveOldResult instanceof Error) {
                    return reject(archiveOldResult)
                }
            }

            // DB変更用オブジェクトの生成
            const upsertSetter = card
            const upsertUnsetter = { cost: true, attack: true, oc: true, subtypes: true, effect: true, tags: true, page_title: true, } as any
            Object.keys(card).forEach(key => delete upsertUnsetter[key])

            cardDb.update({ pageid: card.pageid }, { $set: upsertSetter, $unset: upsertUnsetter }, { upsert: true }, function (errorOfUpsert) {
                if (errorOfUpsert) {
                    return reject(errorOfUpsert)
                }
                // NeDBのコンパクション実行
                cardDb.persistence.compactDatafile()
                return resolve()
            })
        })
    )
}

// カード削除
export async function bulkDelete(deleteTargetCardPageids: number[]) {
    return new Promise((resolve: (deletedCardsCount: number) => any, reject: (error: Error) => any) => 
        // 削除対象のカードを抽出
        cardDb.find({ pageid: { $in: deleteTargetCardPageids } }).exec(async function (errorOfFind, cardsToDelete) {
            if (errorOfFind) {
                return reject(errorOfFind)
            }

            // _idを_id_oldに変更（旧カード用DBでの重複を避けるため）
            cardsToDelete.forEach(oldCard => {
                oldCard._id_old = oldCard._id
                delete oldCard._id
            })

            // 旧カード用DBに投入
            const archiveOldResult = await archiveOld(cardsToDelete).catch((reason) => reason)
            if (archiveOldResult instanceof Error) {
                return reject(archiveOldResult)
            }

            // 現カード用DBから削除
            cardDb.remove({ pageid: { $in: cardsToDelete.map(oldCard => oldCard.pageid) } }, { multi: true }, function (errorOfDelete, deletedCardsCount) {
                if (errorOfDelete) {
                    return reject(errorOfDelete)
                }
                // NeDBのコンパクション実行
                cardDb.persistence.compactDatafile()
                return resolve(deletedCardsCount)
            })
        })
    )
}

// 旧カード用DBに投入
async function archiveOld(docOrDocs: any): Promise<void> {
    return new Promise((resolve, reject) => {
        oldCardDb.insert(docOrDocs, function (errorOfInsert) {
            if (errorOfInsert) {
                return reject(errorOfInsert)
            }
            // NeDBのコンパクション実行
            oldCardDb.persistence.compactDatafile()
            return resolve()
        })
    })
}