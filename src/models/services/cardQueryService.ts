import { Card } from '../card';
import { cardDb, oldCardDb } from './../../dao';

// DBに存在するカードのpageidとlastrevidのペアの配列
export async function currentCards() {
    return new Promise<{ pageid: number, lastrevid: number }[]>((resolve, reject) => 
        cardDb.find({}, { _id: 0, pageid: 1, lastrevid: 1 }, function (errorOfFind, cards) {
            if (errorOfFind) {
                return reject(errorOfFind);
            }

            return resolve(cards);
        })
    );
}

// カード検索（まんまNeDBのクエリが動くのであまりよろしくない）
export async function find(query: any, projection: any, sort: any, skip: number, limit: number) {
    return new Promise(
        (resolve: (cards: Card[]) => any, reject: (error: Error) => any) => 
            cardDb.find(query, projection).sort(sort).skip(skip).limit(limit).exec(function (err, cards) {
                if (err) {
                    return reject(err);
                }

                return resolve(cards);
            })
    );
}

// カード検索（まんまNeDBのクエリが動くのであまりよろしくない）
export async function findAll(query: any, projection: any, sort: any) {
    return new Promise(
        (resolve: (cards: Card[]) => any, reject: (error: Error) => any) => 
            cardDb.find(query, projection).sort(sort).exec(function (err, cards) {
                if (err) {
                    return reject(err);
                }

                return resolve(cards);
            })
    );
}

export async function count(query: any) {
    return new Promise(
        (resolve: (count: number) => any, reject: (error: Error) => any) => 
            cardDb.count(query).exec(function (err, count) {
                if (err) {
                    return reject(err);
                }

                return resolve(count);
            })
    );
}
