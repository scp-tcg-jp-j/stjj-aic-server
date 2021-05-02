import Datastore from 'nedb'
import { logger } from './logger'

const DB_BASE = '/home/stjj-aic/nedb'
export const cardDb = new Datastore({ filename: DB_BASE + '/cards.nedb'})
cardDb.loadDatabase(function (err) {
    if (err) {
        logger.error('STJJ.AIC: cards.nedbの読み込みに失敗しました')
        logger.error(err)
    } else {
        logger.info('STJJ.AIC: cards.nedbの読み込みに成功しました')   
    }
})

export const oldCardDb = new Datastore({ filename: DB_BASE + '/old_cards.nedb'})
oldCardDb.loadDatabase(function (err) {
    if (err) {
        logger.error('STJJ.AIC: old_cards.nedbの読み込みに失敗しました')
        logger.error(err)
    } else {
        logger.info('STJJ.AIC: old_cards.nedbの読み込みに成功しました')   
    }
})

export const accountDb = new Datastore({ filename: DB_BASE + '/account.nedb' })
accountDb.loadDatabase(function (err) {
    if (err) {
        logger.error('STJJ.AIC: account.nedbの読み込みに失敗しました')
        logger.error(err)
    } else {
        logger.info('STJJ.AIC: account.nedbの読み込みに成功しました')   
    }
})