import Datastore from 'nedb'

const DB_BASE = '/home/stjj-aic/nedb'
export const cardDb = new Datastore({ filename: DB_BASE + '/cards.nedb'})
cardDb.loadDatabase(function (err) {
    if (err) {
        console.error('STJJ.AIC: cards.nedbの読み込みに失敗しました')
        console.error(err)
    } else {
        console.log('STJJ.AIC: cards.nedbの読み込みに成功しました')
    }
})

export const oldCardDb = new Datastore({ filename: DB_BASE + '/old_cards.nedb'})
oldCardDb.loadDatabase(function (err) {
    if (err) {
        console.error('STJJ.AIC: old_cards.nedbの読み込みに失敗しました')
        console.error(err)
    } else {
        console.log('STJJ.AIC: old_cards.nedbの読み込みに成功しました')
    }
})